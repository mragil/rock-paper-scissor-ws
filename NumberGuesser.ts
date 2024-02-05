import { z } from "zod";

import { ClientData, Message, Score, ServerWebSocket } from "./type";

import Room from "./Room";
import { TARGET_LIMIT } from "./constant";

class NumberGuesser {
  private room: Room;
  private currentPlayer: ServerWebSocket<ClientData>;
  private targetNumber: number;
  private minLimit: number;
  private maxLimit: number;
  private scores: Score;
  private counter: number;
  private timerPlayer?: Timer;
  private replay: string[];

  constructor(room: Room) {
    this.room = room;
    this.targetNumber = 0;
    this.counter = 15;
    this.replay = [];
    this.scores = this.room.getMember().reduce(
      (acc, member) => ({
        ...acc,
        [member.data.username]: 0,
      }),
      {}
    );
    this.currentPlayer = this.room.getMember()[0];
    this.minLimit = 0;
    this.maxLimit = 0;

    this.informGameStart();
  }

  private findNextPlayer() {
    return this.room
      .getMember()
      .find((player) => player !== this.currentPlayer)!;
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

  private resetTimer() {
    clearInterval(this.timerPlayer);
    this.counter = 15;
    this.timerPlayer = undefined;
  }

  private resetGame() {
    this.replay = [];
    this.resetTimer();
    this.room.broadcastMessage({ type: "REPLAY", text: `Lets Play Again` });
  }

  private informPlayerTurn() {
    const msg: Message = {
      type: "PLAYER_TURN",
      text: `${this.currentPlayer.data.username}}`,
    };
    this.room.broadcastMessage(msg);

    //TIMER
    if (!this.timerPlayer) {
      this.timerPlayer = setInterval(() => {
        if (this.counter === 0) {
          this.room.broadcastMessage({
            type: "TIMER",
            text: `TIME OUT`,
          });

          const winner = this.findNextPlayer().data.username;
          this.scores[winner] = this.scores[winner] + 1;

          this.room.broadcastMessage({
            type: "RESULT",
            text: `${winner}`,
            data: {
              score: this.scores,
            },
          });
          this.resetTimer();
        } else {
          this.room.sendMessage(this.currentPlayer, {
            type: "TIMER",
            text: `${this.counter} second left`,
          });
        }
        this.counter = this.counter - 1;
      }, 1000);
    }
  }

  private informGameStart() {
    this.targetNumber = Math.floor(Math.random() * TARGET_LIMIT) + 1;
    this.minLimit = 1;
    this.maxLimit = TARGET_LIMIT;

    let msg: Message = {
      type: "OPPONENT",
      text: `${this.room.getMember().map((member) => member.data.username)}`,
    };
    this.room.broadcastMessage(msg);

    //Inform target number to all player
    msg = {
      type: "GAME",
      text: `${this.targetNumber}`,
    };
    this.room.broadcastMessage(msg);

    //Inform Player 1 turn
    this.informPlayerTurn();
  }

  public playerTurn(ws: ServerWebSocket<ClientData>, message: Message) {
    const numberGuessed = z.coerce.number().parse(message.text);
    const { username } = ws.data;
    if (numberGuessed === this.minLimit || numberGuessed === this.maxLimit) {
      this.room.sendMessage(ws, {
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
      this.room.broadcastMessage({
        type: "RESULT",
        text: `Winner is ${username}`,
        data: {
          score: this.scores,
        },
      });
      this.resetTimer();
      return;
    }

    this.room.broadcastMessage({
      type: "INFO",
      text: `The target number is ${this.calculateTargetNumberRange(
        numberGuessed,
        this.targetNumber
      )}`,
    });

    this.currentPlayer = this.findNextPlayer();
    this.informPlayerTurn();
  }

  public handleReplay(ws: ServerWebSocket<ClientData>) {
    if (this.room.getMember().length !== 2) {
      return;
    }

    if (this.timerPlayer) {
      return;
    }

    this.replay.push(ws.data.username);
    if (this.replay.length !== 2) {
      const msg: Message = {
        type: "INFO",
        text: "Waiting for other player...",
      };
      this.room.sendMessage(ws, msg);
      return;
    }
    this.resetGame();

    this.currentPlayer = this.findNextPlayer();
    this.informGameStart();
  }

  public handlePlayerLeave(username: string) {
    this.counter = 15;
    this.replay = [];
    delete this.scores[username];
    this.scores[Object.keys(this.scores)[0]] = 0;
    this.resetTimer();
  }
}

export default NumberGuesser;
