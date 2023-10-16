import { ClientData, Rooms, ServerWebSocket } from "./type";

import Room from "./Room";

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
}

export default Playground;
