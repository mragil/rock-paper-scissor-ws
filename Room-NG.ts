import {
  ClientData,
  Message,
  ResultMessage,
  Score,
  ServerWebSocket,
} from "./type.NG";

import { TARGET_LIMIT } from "./constant";

class Room {
  private member: ServerWebSocket<ClientData>[];
  private targetNumber: number;
  private counter: number;
  private timerPlayer?: Timer;
  private replay: string[];
  private scores: Score;
  private currentPlayer: ServerWebSocket<ClientData>;
  private minLimit: number;
  private maxLimit: number;

  constructor(room: string, username: string, ws: ServerWebSocket<ClientData>) {
    this.member = [ws];
    this.targetNumber = Math.floor(Math.random() * TARGET_LIMIT) + 1;
    this.counter = 15;
    this.replay = [];
    this.scores = { [username]: 0 };
    this.currentPlayer = ws;
    this.minLimit = 1;
    this.maxLimit = TARGET_LIMIT;
  }

  public getMemberCount() {
    return this.member.length;
  }

  public getMemberName() {
    console.log(this.member);
    return this.member.map((ws) => ws.data.username);
  }

  public isUserInRoom(username: string) {
    const existingUsername = this.member.find(
      (client) => client.data.username === username
    );
    return !!existingUsername;
  }

  private broadcastMessage(message: Message | ResultMessage) {
    this.member.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  private sendMessage(ws: ServerWebSocket<ClientData>, message: Message) {
    ws.send(JSON.stringify(message));
  }

  private resetTimer() {
    clearInterval(this.timerPlayer);
    this.counter = 15;
    this.timerPlayer = undefined;
  }

  private resetGame() {
    this.replay = [];
    this.resetTimer();
    this.broadcastMessage({ type: "REPLAY", text: `Lets Play Again` });
  }

  private informPlayerTurn() {
    const msg: Message = {
      type: "PLAYER_TURN",
      text: `${this.currentPlayer.data.username}}`,
    };
    this.broadcastMessage(msg);

    //TIMER
    if (!this.timerPlayer) {
      this.timerPlayer = setInterval(() => {
        if (this.counter === 0) {
          this.broadcastMessage({
            type: "TIMER",
            text: `TIME OUT`,
          });

          const winner = this.member.find(
            (player) => player !== this.currentPlayer
          )!.data.username;
          this.scores[winner] = this.scores[winner] + 1;

          this.broadcastMessage({
            type: "RESULT",
            text: `${winner}`,
            data: {
              score: this.scores,
            },
          });
          this.resetTimer();
        } else {
          this.sendMessage(this.currentPlayer, {
            type: "TIMER",
            text: `${this.counter} second left`,
          });
        }
        this.counter = this.counter - 1;
      }, 1000);
    }
  }

  private calculateTargetNumberRange = (
    numberGuessed: number,
    targetNumber: number
  ) => {
    let result;

    if (numberGuessed < targetNumber) {
      result = `${numberGuessed} - ${this.maxLimit}`;
      this.minLimit = numberGuessed;
    }
    if (numberGuessed > targetNumber) {
      result = `${this.minLimit} - ${numberGuessed}`;
      this.maxLimit = numberGuessed;
    }
    return result;
  };

  public informGameStart(ws: ServerWebSocket<ClientData>, username: string) {
    let msg: Message = {
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
    //Inform target number to all player
    msg = {
      type: "GAME",
      text: `${this.targetNumber}`,
    };
    this.broadcastMessage(msg);
    //Inform Player 1 turn
    this.currentPlayer = this.member[0];
    this.informPlayerTurn();
  }

  public playerTurn(ws: ServerWebSocket<ClientData>, numberGuessed: number) {
    const { username } = ws.data;
    if (numberGuessed === this.minLimit || numberGuessed === this.maxLimit) {
      this.sendMessage(ws, {
        type: "INFO",
        text: `The number you guessed must be bigger thank ${this.minLimit} and less than ${this.maxLimit}`,
      });
      return;
    }

    this.resetTimer();

    if (username !== this.currentPlayer.data.username) {
      return;
    }

    if (numberGuessed === this.targetNumber) {
      this.scores[username] = this.scores[username] + 1;
      this.broadcastMessage({
        type: "RESULT",
        text: `Winner is ${username}`,
        data: {
          score: this.scores,
        },
      });
      this.resetTimer();
      return;
    }

    this.broadcastMessage({
      type: "INFO",
      text: `The target number is ${this.calculateTargetNumberRange(
        numberGuessed,
        this.targetNumber
      )}`,
    });

    this.currentPlayer = this.member.find(
      (player) => player.data.username !== username
    )!;
    this.informPlayerTurn();
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
    this.counter = 15;
    this.replay = [];
    delete this.scores[username];
    this.scores[Object.keys(this.scores)[0]] = 0;

    if (this.member.length === 0) {
      return;
    }

    const msg: Message = {
      type: "OPPONENT-LEFT",
      text: `${username} has left the chat`,
    };
    this.broadcastMessage(msg);

    this.resetGame();
  }
}

export default Room;
