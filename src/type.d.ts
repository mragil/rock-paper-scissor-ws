import { ServerWebSocket } from "bun";
import Room from "./Room";

interface ClientData {
  username: string;
  room: string;
  genre: Genre;
}

type Pick = "Rock" | "Paper" | "Scissor";

interface GameRPS {
  [key: string]: Pick;
}

interface NGList {
  [key: string]: number[];
}

interface GameNG {
  player: NGList;
  targetNumber: number;
}

interface Score {
  [key: string]: number;
}

interface Result {
  score: Score;
  game?: GameRPS | GameNG;
}

interface Rooms {
  [key: string | number]: Room;
}

interface Message {
  type:
    | "INFO"
    | "MODAL-INFO"
    | "CHAT"
    | "GAME"
    | "PLAYER_TURN"
    | "END_PLAYER_TURN"
    | "OPPONENT"
    | "TIMER"
    | "RESULT"
    | "RESET"
    | "REPLAY"
    | "OPPONENT-LEFT";
  text: string | Buffer;
}

interface ResultMessage extends Message {
  type: "RESULT";
  data: Result;
}

type Genre = "ROCK_PAPER_SCISSOR" | "NUMBER_GUESSER";

export {
  ClientData,
  GameRPS,
  GameNG,
  Genre,
  Message,
  Pick,
  ResultMessage,
  Rooms,
  Score,
  ServerWebSocket,
};
