import { ServerWebSocket } from "bun";

interface ClientData {
  username: string;
  room: string;
}

interface Game {
  [key: string]: "Rock" | "Paper" | "Scissor";
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

export { ClientData, Game, Message, Room, ServerWebSocket };
