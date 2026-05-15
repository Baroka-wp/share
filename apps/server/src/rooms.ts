import { randomBytes } from "node:crypto";
import {
  ROOM_ID_ALPHABET,
  ROOM_ID_LENGTH,
  ROOM_TTL_MS,
  type RoomPublic,
  type RoomState,
} from "@share-slides/shared";

const rooms = new Map<string, RoomState>();

export function generateRoomId(): string {
  const bytes = randomBytes(ROOM_ID_LENGTH);
  let id = "";
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    id += ROOM_ID_ALPHABET[bytes[i]! % ROOM_ID_ALPHABET.length];
  }
  return id;
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function createRoom(input: {
  title: string;
  pdfPath: string;
  pageCount: number;
  pin?: string | null;
}): RoomState {
  let id = generateRoomId();
  while (rooms.has(id)) id = generateRoomId();

  const presenterToken = generateToken();
  const now = Date.now();
  const room: RoomState = {
    id,
    title: input.title,
    pdfPath: input.pdfPath,
    pageCount: input.pageCount,
    currentPage: 1,
    controllerId: null,
    allowTakeControl: true,
    presenterToken,
    pin: input.pin ?? null,
    hasPin: Boolean(input.pin),
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): RoomState | undefined {
  const room = rooms.get(id);
  if (!room) return undefined;
  if (Date.now() > room.expiresAt) {
    rooms.delete(id);
    return undefined;
  }
  return room;
}

export function toPublic(room: RoomState): RoomPublic {
  return {
    id: room.id,
    title: room.title,
    pageCount: room.pageCount,
    currentPage: room.currentPage,
    controllerId: room.controllerId,
    allowTakeControl: room.allowTakeControl,
    hasPin: room.hasPin,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
  };
}

export function verifyPin(room: RoomState, pin: string | null | undefined): boolean {
  if (!room.pin) return true;
  return pin === room.pin;
}

export function verifyPresenterToken(room: RoomState, token: string | null | undefined): boolean {
  return Boolean(token && token === room.presenterToken);
}

export function purgeExpiredRooms(): void {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now > room.expiresAt) rooms.delete(id);
  }
}

setInterval(purgeExpiredRooms, 60_000);
