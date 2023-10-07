import { ServerWebSocket } from "bun";

interface ClientData {
  username: string;
  room: string;
}

type Pick = "Rock" | "Paper" | "Scissor";

interface Game {
  [key: string]: Pick;
}

interface Room {
  [key: string | number]: {
    member: ServerWebSocket<ClientData>[];
    game: Game;
    counter: number;
    timer?: Timer;
  };
}

interface Message {
  type: "INFO" | "CHAT" | "GAME" | "OPPONENT" | "TIMER" | "RESULT" | "RESET";
  text: string | Buffer;
}

interface ResultMessage extends Message {
  type: "RESULT";
  data: Game;
}

export {
  ResultMessage,
  ClientData,
  Game,
  Message,
  Pick,
  Room,
  ServerWebSocket,
};
