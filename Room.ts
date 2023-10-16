import {
  ClientData,
  Game,
  Message,
  Pick,
  ResultMessage,
  Score,
  ServerWebSocket,
} from "./type";

import calculateGame from "./rockPaperScissor";

class Room {
  private member: ServerWebSocket<ClientData>[];
  private game: Game;
  private counter: number;
  private timer?: Timer;
  private replay: string[];
  private scores: Score;

  constructor(room: string, username: string, ws: ServerWebSocket<ClientData>) {
    this.member = [ws];
    this.game = {};
    this.counter = 15;
    this.replay = [];
    this.scores = { [username]: 0 };
  }

  public getMemberCount() {
    return this.member.length;
  }

  public isUserInRoom(username: string) {
    const existingUsername = this.member.find(
      (client) => client.data.username === username
    );
    return !!existingUsername;
  }

  public broadcastMessage(message: Message | ResultMessage) {
    this.member.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  private sendMessage(ws: ServerWebSocket<ClientData>, message: Message) {
    ws.send(JSON.stringify(message));
  }

  private resetTimer() {
    clearInterval(this.timer);
    this.counter = 15;
    this.timer = undefined;
  }

  private resetGame() {
    this.game = {};
    this.replay = [];
    this.broadcastMessage({ type: "REPLAY", text: `Lets Play Again` });
  }

  public informOpponent(ws: ServerWebSocket<ClientData>, username: string) {
    const msg: Message = {
      type: "OPPONENT",
      text: username,
    };
    this.broadcastMessage(msg);
    this.sendMessage(ws, {
      type: "OPPONENT",
      text: this.member[0].data.username,
    });
    this.member.push(ws);
    this.scores[username] = 0;
  }

  public handleGame(username: string, pick: Pick) {
    //When Player Pick Before Opponent is present (only 1 player in room)
    if (this.member.length !== 2) {
      return;
    }

    this.game[username] = pick;

    //TIMER
    if (!this.timer) {
      this.timer = setInterval(() => {
        if (this.counter === 0) {
          this.broadcastMessage({
            type: "TIMER",
            text: `TIME OUT`,
          });

          const winner = Object.keys(this.game)[0];
          this.scores[winner] = this.scores[winner] + 1;

          this.broadcastMessage({
            type: "RESULT",
            text: `${winner}`,
            data: {
              game: this.game,
              score: this.scores,
            },
          });
          this.resetTimer();
        } else {
          this.broadcastMessage({
            type: "TIMER",
            text: `${this.counter} second left`,
          });
        }
        this.counter = this.counter - 1;
      }, 1000);
    }

    //2 Player Already Pick
    if (Object.keys(this.game).length === 2) {
      const winner = calculateGame(this.game);
      if (winner !== "DRAW" && winner !== undefined) {
        this.scores[winner] = this.scores[winner] + 1;
      }
      const resultMsg: ResultMessage = {
        type: "RESULT",
        text: `${winner}`,
        data: {
          game: this.game,
          score: this.scores,
        },
      };
      this.broadcastMessage(resultMsg);
      this.resetTimer();
    }
  }

  public handleReset(username: string, ws: ServerWebSocket<ClientData>) {
    this.replay.push(username);
    if (this.replay.length !== 2) {
      const msg: Message = {
        type: "INFO",
        text: "Waiting for other player...",
      };
      this.sendMessage(ws, msg);
      return;
    }
    this.resetGame();
  }

  public handleLeave(username: string, ws: ServerWebSocket<ClientData>) {
    this.member = this.member.filter((client) => client != ws);

    if (this.member.length === 0) {
      return;
    }

    const msg: Message = {
      type: "INFO",
      text: `${username} has left the chat`,
    };
    this.broadcastMessage(msg);
  }
}

export default Room;
