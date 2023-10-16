import { ServerWebSocket } from "bun";
import Room from "./Room";

interface ClientData {
  username: string;
  room: string;
}

type Pick = "Rock" | "Paper" | "Scissor";

interface Game {
  [key: string]: Pick;
}

interface Score {
  [key: string]: number;
}

interface Result {
  game: Game;
  score: Score;
}

interface Rooms {
  [key: string | number]: Room;
}

interface Message {
  type:
    | "INFO"
    | "CHAT"
    | "GAME"
    | "OPPONENT"
    | "TIMER"
    | "RESULT"
    | "RESET"
    | "REPLAY";
  text: string | Buffer;
}

interface ResultMessage extends Message {
  type: "RESULT";
  data: Result;
}

export {
  ClientData,
  Game,
  Message,
  Pick,
  ResultMessage,
  Rooms,
  ServerWebSocket,
  Score
};
