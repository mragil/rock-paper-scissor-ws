import {
  ClientData,
  Message,
  ResultMessage,
  Room,
  ServerWebSocket,
} from "./type";

import { LIMIT, PORT } from "./constant";
import calculateGame from "./rockPaperScissor";
import { gamePickSchema } from "./schema";
const rooms: Room = {};
let timer: Timer;

const sendMessageToRoom = (room: string, message: Message | ResultMessage) => {
  rooms[room].member.forEach((client) => {
    client.send(JSON.stringify(message));
  });
};

const sendMessage = (ws: ServerWebSocket<ClientData>, message: Message) => {
  ws.send(JSON.stringify(message));
};

const getDataFromQuery = (req: Request, key: string) => {
  return new URL(req.url).searchParams.get(key);
};

const resetGame = (room: string) => {
  clearInterval(rooms[room].timer);
  rooms[room].game = {};
  rooms[room].counter = 15;
  rooms[room].timer = undefined;
  sendMessageToRoom(room, { type: "RESET", text: `Lets Play Again` });
};

const server = Bun.serve<ClientData>({
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/")
      return Response.json({
        hai: "Hello",
      });
    if (url.pathname === "/chat") {
      const username = getDataFromQuery(req, "userName");
      const room = getDataFromQuery(req, "roomName");

      if (
        room === null ||
        username === null ||
        room === "" ||
        username === ""
      ) {
        return new Response("Room Name or User Name Cannot Be Empty");
      }

      if (rooms[room]) {
        if (rooms[room]?.member.length === LIMIT) {
          return new Response(`Sudah LIMIT 2 ORANG DI ROOM ${room}`, {
            status: 400,
          });
        }
        const existingUsername = rooms[room].member.find(
          (client) => client.data.username === username
        );

        if (existingUsername) {
          return new Response(
            `Username: ${username} already exist in the room`,
            { status: 400 }
          );
        }
      }
      const success = server.upgrade(req, { data: { username, room } });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    }

    return new Response("Hello world");
  },
  port: PORT,
  websocket: {
    open(ws) {
      const { room, username } = ws.data;
      if (!rooms[room]) {
        rooms[room] = { member: [ws], game: {}, counter: 15, timer };
      } else {
        const msg: Message = {
          type: "OPPONENT",
          text: username,
        };
        sendMessageToRoom(room, msg);
        sendMessage(ws, {
          type: "OPPONENT",
          text: rooms[room].member[0].data.username,
        });
        rooms[room].member.push(ws);
      }
    },
    message(ws, message) {
      const { room, username } = ws.data;
      const parsedMessage: Message = JSON.parse(message.toString());
      let msg: Message;
      switch (parsedMessage.type) {
        case "INFO":
          console.log("INFO MASE");
          break;
        case "CHAT":
          msg = {
            type: "CHAT",
            text: `${username}: ${parsedMessage.text}`,
          };
          sendMessageToRoom(room, msg);
          break;
        case "GAME":
          //When Player Pick Before Opponent is present (only 1 player in room)
          if (rooms[room].member.length !== 2) {
            sendMessage(ws, { type: "INFO", text: "Sabar Nunggu Lawan" });
            return;
          }
          msg = {
            type: "INFO",
            text: `${username} choose ${parsedMessage.text}`,
          };
          const parsedPick = gamePickSchema.safeParse(parsedMessage.text);
          if (parsedPick.success) {
            rooms[room].game[username] = parsedPick.data;
          }
          sendMessageToRoom(room, msg);

          //TIMER
          if (!rooms[room].timer) {
            rooms[room].timer = setInterval(() => {
              if (rooms[room].counter === 0) {
                sendMessageToRoom(room, {
                  type: "TIMER",
                  text: `TIME OUT`,
                });
                sendMessageToRoom(room, {
                  type: "RESULT",
                  text: `${Object.keys(rooms[room].game)[0]}`,
                  data: rooms[room].game,
                });
                resetGame(room);
              } else {
                sendMessageToRoom(room, {
                  type: "TIMER",
                  text: `${rooms[room].counter} second left`,
                });
              }
              rooms[room].counter = rooms[room].counter - 1;
            }, 1000);
          }

          //2 Player Already Pick
          if (Object.keys(rooms[room].game).length === 2) {
            const winner = calculateGame(rooms[room].game);
            const resultMsg: ResultMessage = {
              type: "RESULT",
              text: `${winner}`,
              data: rooms[room].game,
            };
            sendMessageToRoom(room, resultMsg);
            resetGame(room);
          }
          break;
        default:
          console.log("NOTHING MASE");
      }
    },
    close(ws) {
      const { room, username } = ws.data;
      rooms[room].member = rooms[room].member.filter((client) => client != ws);

      if (rooms[room].member.length === 0) {
        delete rooms[room];
        return;
      }

      const msg: Message = {
        type: "INFO",
        text: `${username} has left the chat`,
      };
      sendMessageToRoom(room, msg);
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
