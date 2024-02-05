import Game from "./Game";
import { ClientData, Message, ResultMessage, ServerWebSocket } from "./type";

class Room {
  private member: ServerWebSocket<ClientData>[];
  private game: Game | undefined;

  constructor(ws: ServerWebSocket<ClientData>) {
    this.member = [ws];
    this.game = undefined;
  }

  public getMemberCount() {
    return this.member.length;
  }

  public getMemberName() {
    console.log(this.member);
    return this.member.map((ws) => ws.data.username);
  }

  public getMember() {
    return this.member;
  }

  public isUserInRoom(username: string) {
    const existingUsername = this.member.find(
      (client) => client.data.username === username
    );
    return !!existingUsername;
  }

  public addMember(ws: ServerWebSocket<ClientData>) {
    this.member.push(ws);
    if (this.member.length === 2) {
      this.game = new Game(this);
    }
  }

  public broadcastMessage(message: Message | ResultMessage) {
    this.member.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  }

  public sendMessage(ws: ServerWebSocket<ClientData>, message: Message) {
    ws.send(JSON.stringify(message));
  }

  public handleGamePlay(ws: ServerWebSocket<ClientData>, message: Message) {
    this.game?.playerTurn(ws, message);
  }

  public handleReplay(ws: ServerWebSocket<ClientData>) {
    this.game?.handleReplay(ws);
  }

  public handleLeave(ws: ServerWebSocket<ClientData>) {
    const { username } = ws.data;
    this.member = this.member.filter((client) => client != ws);

    if (this.member.length === 0) {
      return;
    }

    const msg: Message = {
      type: "OPPONENT-LEFT",
      text: `${username} has left the room`,
    };
    this.broadcastMessage(msg);

    this.game?.handlePlayerLeave(username);
  }
}

export default Room;
