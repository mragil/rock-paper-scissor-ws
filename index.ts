import { ClientData, Message, Room } from "./type";

import Game from "./Game";
import { LIMIT, PORT } from "./constant";
import { gamePickSchema } from "./schema";
const rooms: Room = {};

const getDataFromQuery = (req: Request, key: string) => {
  return new URL(req.url).searchParams.get(key);
};

const rpsGame = new Game();

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
      if (!rpsGame.isRoomExist(room)) {
        rpsGame.initializeRoom(room, username, ws);
      } else {
        rpsGame.informOpponent(ws, room, username);
      }
    },
    message(ws, message) {
      const { room, username } = ws.data;
      const parsedMessage: Message = JSON.parse(message.toString());
      let msg: Message;
      switch (parsedMessage.type) {
        case "GAME":
          const parsedPick = gamePickSchema.parse(parsedMessage.text);
          rpsGame.handleGame(room, username, parsedPick);
          break;
        case "RESET":
          rpsGame.handleReset(room, username, ws);
          break;
        default:
          console.log("NOTHING MASE");
      }
    },
    close(ws) {
      const { room, username } = ws.data;
      rpsGame.handleClose(room, username, ws);
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
