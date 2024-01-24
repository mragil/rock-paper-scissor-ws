import { ClientData, Rooms, ServerWebSocket } from "./type.NG";

import Room from "./Room";
import { LIMIT } from "./constant";

class Playground {
  private rooms: Rooms;

  public constructor() {
    this.rooms = {};
  }

  public initializeRoom(
    room: string,
    username: string,
    ws: ServerWebSocket<ClientData>
  ) {
    this.rooms[room] = new Room(room, username, ws);
  }

  public isRoomExist(room: string) {
    return !!this.rooms[room];
  }

  public getRoom(room: string) {
    if (!this.isRoomExist(room)) {
      throw new Error("Room not found!");
    }
    return this.rooms[room];
  }

  public deleteRoom(room: string) {
    delete this.rooms[room];
  }

  public getRooms() {
    const roomNames = Object.keys(this.rooms);
    const data = roomNames.map((name) => {
      return {
        name,
        isFull: this.getRoom(name).getMemberCount() === LIMIT,
        member: this.getRoom(name).getMemberName(),
      };
    });
    return data;
  }
}

export default Playground;
