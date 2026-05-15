import { randomBytes } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOM_ID_ALPHABET,
  ROOM_ID_LENGTH,
  ROOM_TTL_MS,
  type RoomPublic,
  type RoomState,
} from "@share-slides/shared";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

const rooms = new Map<string, RoomState>();

type Row = {
  id: string;
  title: string;
  pdf_path: string;
  page_count: number;
  current_page: number;
  allow_take_control: number;
  require_name: number;
  has_pin: number;
  pin: string | null;
  presenter_token: string;
  created_at: number;
  expires_at: number;
};

function rowToRoom(row: Row): RoomState {
  return {
    id: row.id,
    title: row.title,
    pdfPath: row.pdf_path,
    pageCount: row.page_count,
    currentPage: row.current_page,
    controllerId: null,
    allowTakeControl: Boolean(row.allow_take_control),
    requireName: Boolean(row.require_name),
    hasPin: Boolean(row.has_pin),
    pin: row.pin,
    presenterToken: row.presenter_token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

const insertStmt = db.prepare(`
  INSERT INTO rooms (
    id, title, pdf_path, page_count, current_page,
    allow_take_control, require_name, has_pin, pin,
    presenter_token, created_at, expires_at
  ) VALUES (
    @id, @title, @pdfPath, @pageCount, @currentPage,
    @allowTakeControl, @requireName, @hasPin, @pin,
    @presenterToken, @createdAt, @expiresAt
  )
`);

const updateStmt = db.prepare(`
  UPDATE rooms SET
    title = @title,
    page_count = @pageCount,
    current_page = @currentPage,
    allow_take_control = @allowTakeControl,
    require_name = @requireName,
    has_pin = @hasPin,
    pin = @pin,
    expires_at = @expiresAt
  WHERE id = @id
`);

const deleteStmt = db.prepare(`DELETE FROM rooms WHERE id = ?`);
const selectByIdStmt = db.prepare(`SELECT * FROM rooms WHERE id = ?`);
const selectActiveStmt = db.prepare(
  `SELECT * FROM rooms WHERE expires_at > ?`,
);
const selectExpiredStmt = db.prepare(
  `SELECT id, pdf_path FROM rooms WHERE expires_at <= ?`,
);

function persistRoom(room: RoomState, isNew: boolean): void {
  const params = {
    id: room.id,
    title: room.title,
    pdfPath: room.pdfPath,
    pageCount: room.pageCount,
    currentPage: room.currentPage,
    allowTakeControl: room.allowTakeControl ? 1 : 0,
    requireName: room.requireName ? 1 : 0,
    hasPin: room.hasPin ? 1 : 0,
    pin: room.pin,
    presenterToken: room.presenterToken,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
  };
  if (isNew) insertStmt.run(params);
  else updateStmt.run(params);
}

export function saveRoom(room: RoomState): void {
  persistRoom(room, false);
}

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
  requireName?: boolean;
}): RoomState {
  let id = generateRoomId();
  while (rooms.has(id) || selectByIdStmt.get(id)) id = generateRoomId();

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
    requireName: Boolean(input.requireName),
    presenterToken,
    pin: input.pin ?? null,
    hasPin: Boolean(input.pin),
    createdAt: now,
    expiresAt: now + ROOM_TTL_MS,
  };
  rooms.set(id, room);
  persistRoom(room, true);
  return room;
}

export function getRoom(id: string): RoomState | undefined {
  let room = rooms.get(id);
  if (!room) {
    const row = selectByIdStmt.get(id) as Row | undefined;
    if (!row) return undefined;
    room = rowToRoom(row);
    rooms.set(id, room);
  }
  if (Date.now() > room.expiresAt) {
    rooms.delete(id);
    void cleanupRoomFiles(room.pdfPath);
    deleteStmt.run(id);
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
    requireName: room.requireName,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
  };
}

export function normalizePin(pin: string | null | undefined): string {
  if (!pin) return "";
  return pin.replace(/\D/g, "");
}

export function verifyPin(room: RoomState, pin: string | null | undefined): boolean {
  if (!room.pin) return true;
  return normalizePin(pin) === normalizePin(room.pin);
}

export function findRoomByPin(code: string): RoomState | undefined {
  const target = normalizePin(code);
  if (target.length < 6) return undefined;
  const now = Date.now();
  for (const room of rooms.values()) {
    if (now > room.expiresAt) continue;
    if (room.pin && normalizePin(room.pin) === target) return room;
  }
  return undefined;
}

export function verifyPresenterToken(room: RoomState, token: string | null | undefined): boolean {
  return Boolean(token && token === room.presenterToken);
}

async function cleanupRoomFiles(pdfPath: string): Promise<void> {
  try {
    await unlink(path.join(UPLOADS_DIR, pdfPath));
  } catch {
    /* file may already be gone */
  }
}

export function purgeExpiredRooms(): void {
  const now = Date.now();
  const expired = selectExpiredStmt.all(now) as Array<{
    id: string;
    pdf_path: string;
  }>;
  for (const row of expired) {
    rooms.delete(row.id);
    void cleanupRoomFiles(row.pdf_path);
    deleteStmt.run(row.id);
  }
  // Also clean the cache in case any room slipped through getRoom().
  for (const [id, room] of rooms) {
    if (now > room.expiresAt) {
      rooms.delete(id);
      void cleanupRoomFiles(room.pdfPath);
      deleteStmt.run(id);
    }
  }
}

export function loadRoomsFromDisk(): void {
  const now = Date.now();
  const rows = selectActiveStmt.all(now) as Row[];
  for (const row of rows) {
    rooms.set(row.id, rowToRoom(row));
  }
  if (rows.length > 0) {
    console.log(`[rooms] restored ${rows.length} room(s) from SQLite`);
  }
}

loadRoomsFromDisk();
purgeExpiredRooms();
setInterval(purgeExpiredRooms, 60_000);
