import { ServerWebSocket } from "bun";

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

interface Room {
  [key: string | number]: {
    member: ServerWebSocket<ClientData>[];
    game: Game;
    counter: number;
    timer?: Timer;
    replay: string[];
    scores: Score;
  };
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
  Room,
  ServerWebSocket,
};
