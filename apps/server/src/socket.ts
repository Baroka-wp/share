import type { Server, Socket } from "socket.io";
import type {
  ClientMessage,
  ClientRole,
  PresenceClient,
  ServerMessage,
} from "@share-slides/shared";
import type { RoomState } from "@share-slides/shared";
import { toPublic, type getRoom } from "./rooms.js";
import type { ConnectedClient } from "./types.js";

type Deps = {
  io: Server;
  clientsBySocket: Map<string, ConnectedClient>;
  broadcastPresence: (roomId: string) => void;
  getRoom: typeof getRoom;
  toPublic: (room: RoomState) => ReturnType<typeof toPublic>;
  verifyPin: (room: RoomState, pin: string | null | undefined) => boolean;
  verifyPresenterToken: (
    room: RoomState,
    token: string | null | undefined,
  ) => boolean;
};

export function attachSocketHandlers(deps: Deps): void {
  const {
    io,
    clientsBySocket,
    broadcastPresence,
    getRoom,
    toPublic,
    verifyPin,
    verifyPresenterToken,
  } = deps;

  io.on("connection", (socket: Socket) => {
    let client: ConnectedClient | null = null;

    socket.on(
      "join",
      (payload: {
        roomId: string;
        presenterToken?: string;
        pin?: string;
        name?: string;
      }) => {
        const room = getRoom(payload.roomId);
        if (!room) {
          emitError(socket, "Room not found or expired");
          return;
        }

        const isPresenter = verifyPresenterToken(room, payload.presenterToken);
        if (!isPresenter && !verifyPin(room, payload.pin ?? null)) {
          emitError(socket, "Invalid PIN");
          return;
        }

        const role: ClientRole = isPresenter ? "presenter" : "viewer";
        const id = crypto.randomUUID();
        const name =
          (payload.name && payload.name.trim().slice(0, 40)) ||
          (role === "presenter" ? "Presenter" : `Guest ${id.slice(0, 4)}`);

        const activeController = [...clientsBySocket.values()].some(
          (c) => c.roomId === room.id && c.id === room.controllerId,
        );
        if (
          role === "presenter" ||
          !room.controllerId ||
          !activeController
        ) {
          room.controllerId = id;
        }

        client = {
          id,
          socketId: socket.id,
          name,
          role,
          roomId: room.id,
          isController: room.controllerId === id,
        };
        clientsBySocket.set(socket.id, client);
        socket.join(room.id);

        const stateMsg: ServerMessage = {
          type: "STATE",
          room: toPublic(room),
          role,
          clientId: id,
        };
        socket.emit("message", stateMsg);
        broadcastPresence(room.id);

        const slideMsg: ServerMessage = {
          type: "SLIDE",
          page: room.currentPage,
          controllerId: room.controllerId ?? id,
        };
        socket.emit("message", slideMsg);
      },
    );

    socket.on("message", (raw: ClientMessage) => {
      if (!client) return;
      const room = getRoom(client.roomId);
      if (!room) {
        emitError(socket, "Room expired");
        return;
      }

      switch (raw.type) {
        case "SET_NAME": {
          const name = raw.name.trim().slice(0, 40);
          if (name) client.name = name;
          broadcastPresence(room.id);
          break;
        }
        case "SET_ALLOW_TAKE_CONTROL": {
          if (client.role !== "presenter") return;
          room.allowTakeControl = raw.allow;
          break;
        }
        case "SET_PIN": {
          if (client.role !== "presenter") return;
          room.pin = raw.pin;
          room.hasPin = Boolean(raw.pin);
          io.to(room.id).emit("message", {
            type: "STATE",
            room: toPublic(room),
            role: client.role,
            clientId: client.id,
          } satisfies ServerMessage);
          break;
        }
        case "REQUEST_CONTROL": {
          if (client.id === room.controllerId) return;
          if (!room.allowTakeControl && client.role !== "presenter") return;
          if (!room.allowTakeControl && client.role === "presenter") {
            // presenter can always take control
          } else if (!room.allowTakeControl) return;

          room.controllerId = client.id;
          for (const c of clientsBySocket.values()) {
            if (c.roomId !== room.id) continue;
            c.isController = c.id === client.id;
          }
          const msg: ServerMessage = {
            type: "CONTROL",
            controllerId: client.id,
            controllerName: client.name,
          };
          io.to(room.id).emit("message", msg);
          broadcastPresence(room.id);
          break;
        }
        case "RELEASE_CONTROL": {
          if (client.id !== room.controllerId) return;
          const presenter = [...clientsBySocket.values()].find(
            (c) => c.roomId === room.id && c.role === "presenter",
          );
          room.controllerId = presenter?.id ?? client.id;
          for (const c of clientsBySocket.values()) {
            if (c.roomId !== room.id) continue;
            c.isController = c.id === room.controllerId;
          }
          const msg: ServerMessage = {
            type: "CONTROL",
            controllerId: room.controllerId,
            controllerName:
              clientsBySocket.get(
                [...clientsBySocket.entries()].find(
                  ([, c]) => c.id === room.controllerId,
                )?.[0] ?? "",
              )?.name ?? "Presenter",
          };
          io.to(room.id).emit("message", msg);
          broadcastPresence(room.id);
          break;
        }
        case "SLIDE": {
          if (client.id !== room.controllerId) return;
          const page = Math.max(1, Math.min(room.pageCount, raw.page));
          if (page === room.currentPage) return;
          room.currentPage = page;
          const msg: ServerMessage = {
            type: "SLIDE",
            page,
            controllerId: room.controllerId,
          };
          io.to(room.id).emit("message", msg);
          break;
        }
      }
    });

    socket.on("disconnect", () => {
      if (!client) return;
      const room = getRoom(client.roomId);
      clientsBySocket.delete(socket.id);
      if (room && room.controllerId === client.id) {
        const next = [...clientsBySocket.values()].find(
          (c) => c.roomId === room.id && c.role === "presenter",
        ) ?? [...clientsBySocket.values()].find((c) => c.roomId === room.id);
        if (next) {
          room.controllerId = next.id;
          next.isController = true;
          io.to(room.id).emit("message", {
            type: "CONTROL",
            controllerId: next.id,
            controllerName: next.name,
          } satisfies ServerMessage);
        }
      }
      broadcastPresence(client.roomId);
    });
  });
}

function emitError(socket: Socket, message: string): void {
  const msg: ServerMessage = { type: "ERROR", message };
  socket.emit("message", msg);
}
