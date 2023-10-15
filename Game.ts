import {
  ClientData,
  Message,
  Pick,
  ResultMessage,
  Room,
  ServerWebSocket,
} from "./type";

import calculateGame from "./rockPaperScissor";

class Game {
  private rooms: Room;

  public constructor() {
    this.rooms = {};
  }

  public initializeRoom(
    room: string,
    username: string,
    ws: ServerWebSocket<ClientData>
  ) {
    this.rooms[room] = {
      member: [ws],
      game: {},
      counter: 15,
      timer: undefined,
      replay: [],
      scores: {
        [username]: 0,
      },
    };
  }

  public isRoomExist(room: string) {
    return !!this.rooms[room];
  }

  private sendMessageToRoom(room: string, message: Message | ResultMessage) {
    this.rooms[room].member.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  private sendMessage(ws: ServerWebSocket<ClientData>, message: Message) {
    ws.send(JSON.stringify(message));
  }

  public informOpponent(
    ws: ServerWebSocket<ClientData>,
    room: string,
    username: string
  ) {
    const msg: Message = {
      type: "OPPONENT",
      text: username,
    };
    this.sendMessageToRoom(room, msg);
    this.sendMessage(ws, {
      type: "OPPONENT",
      text: this.rooms[room].member[0].data.username,
    });
    this.rooms[room].member.push(ws);
    this.rooms[room].scores[username] = 0;
  }

  private resetTimer(room: string) {
    clearInterval(this.rooms[room].timer);
    this.rooms[room].counter = 15;
    this.rooms[room].timer = undefined;
  }

  private resetGame(room: string) {
    this.rooms[room].game = {};
    this.rooms[room].replay = [];
    this.sendMessageToRoom(room, { type: "REPLAY", text: `Lets Play Again` });
  }

  public handleGame(room: string, username: string, pick: Pick) {
    //When Player Pick Before Opponent is present (only 1 player in room)
    if (this.rooms[room].member.length !== 2) {
      return;
    }

    this.rooms[room].game[username] = pick;

    //TIMER
    if (!this.rooms[room].timer) {
      this.rooms[room].timer = setInterval(() => {
        if (this.rooms[room].counter === 0) {
          this.sendMessageToRoom(room, {
            type: "TIMER",
            text: `TIME OUT`,
          });

          const winner = Object.keys(this.rooms[room].game)[0];
          this.rooms[room].scores[winner] = this.rooms[room].scores[winner] + 1;

          this.sendMessageToRoom(room, {
            type: "RESULT",
            text: `${winner}`,
            data: {
              game: this.rooms[room].game,
              score: this.rooms[room].scores,
            },
          });
          this.resetTimer(room);
        } else {
          this.sendMessageToRoom(room, {
            type: "TIMER",
            text: `${this.rooms[room].counter} second left`,
          });
        }
        this.rooms[room].counter = this.rooms[room].counter - 1;
      }, 1000);
    }

    //2 Player Already Pick
    if (Object.keys(this.rooms[room].game).length === 2) {
      const winner = calculateGame(this.rooms[room].game);
      if (winner !== "DRAW" && winner !== undefined) {
        this.rooms[room].scores[winner] = this.rooms[room].scores[winner] + 1;
      }
      const resultMsg: ResultMessage = {
        type: "RESULT",
        text: `${winner}`,
        data: {
          game: this.rooms[room].game,
          score: this.rooms[room].scores,
        },
      };
      this.sendMessageToRoom(room, resultMsg);
      this.resetTimer(room);
    }
  }

  public handleReset(
    room: string,
    username: string,
    ws: ServerWebSocket<ClientData>
  ) {
    this.rooms[room].replay.push(username);
    if (this.rooms[room].replay.length !== 2) {
      const msg: Message = {
        type: "INFO",
        text: "Waiting for other player...",
      };
      this.sendMessage(ws, msg);
      return;
    }
    this.resetGame(room);
  }

  public handleClose(
    room: string,
    username: string,
    ws: ServerWebSocket<ClientData>
  ) {
    this.rooms[room].member = this.rooms[room].member.filter((client) => client != ws);

    if (this.rooms[room].member.length === 0) {
      delete this.rooms[room];
      return;
    }

    const msg: Message = {
      type: "INFO",
      text: `${username} has left the chat`,
    };
    this.sendMessageToRoom(room, msg);
  }
}

export default Game;