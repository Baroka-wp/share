import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientMessage,
  ClientRole,
  PresenceClient,
  RoomPublic,
  ServerMessage,
} from "@share-slides/shared";
import { API_BASE } from "../config";

type Options = {
  roomId: string;
  presenterToken?: string | null;
  pin?: string | null;
  name?: string;
  enabled: boolean;
};

export function useRoomSocket({
  roomId,
  presenterToken,
  pin,
  name,
  enabled,
}: Options) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [role, setRole] = useState<ClientRole | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [controllerId, setControllerId] = useState<string | null>(null);
  const [controllerName, setControllerName] = useState("Presenter");
  const [presence, setPresence] = useState<PresenceClient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [presenterPin, setPresenterPin] = useState<string | null>(null);

  const isController = clientId !== null && clientId === controllerId;

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.emit("message", msg);
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) return;

    const socket = io(API_BASE || undefined, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", {
        roomId,
        presenterToken: presenterToken ?? undefined,
        pin: pin ?? undefined,
        name: name ?? undefined,
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("message", (msg: ServerMessage) => {
      switch (msg.type) {
        case "STATE":
          setRoom(msg.room);
          setRole(msg.role);
          setClientId(msg.clientId);
          setControllerId(msg.room.controllerId);
          setCurrentPage(msg.room.currentPage);
          break;
        case "SLIDE":
          setCurrentPage(msg.page);
          setControllerId(msg.controllerId);
          break;
        case "CONTROL":
          setControllerId(msg.controllerId);
          setControllerName(msg.controllerName);
          break;
        case "PRESENCE":
          setPresence(msg.clients);
          break;
        case "PRESENTER_CONFIG":
          setPresenterPin(msg.pin);
          break;
        case "ERROR":
          setError(msg.message);
          break;
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, roomId, presenterToken, pin, name]);

  const goToPage = useCallback(
    (page: number) => {
      if (!isController) return;
      send({ type: "SLIDE", page });
      setCurrentPage(page);
    },
    [isController, send],
  );

  return {
    connected,
    room,
    role,
    clientId,
    currentPage,
    controllerId,
    controllerName,
    presence,
    presenterPin,
    error,
    isController,
    send,
    goToPage,
    setError,
  };
}
