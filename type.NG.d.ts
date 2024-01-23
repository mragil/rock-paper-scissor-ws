import { ServerWebSocket } from "bun";
import Room from "./Room-NG";

interface ClientData {
  username: string;
  room: string;
}

interface Score {
  [key: string]: number;
}

interface Result {
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
