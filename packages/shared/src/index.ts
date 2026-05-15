export const ROOM_ID_LENGTH = 8;
export const ROOM_ID_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";
export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export type ClientRole = "presenter" | "viewer";

export interface RoomPublic {
  id: string;
  title: string;
  pageCount: number;
  currentPage: number;
  controllerId: string | null;
  allowTakeControl: boolean;
  hasPin: boolean;
  requireName: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface RoomState extends RoomPublic {
  pdfPath: string;
  presenterToken: string;
  pin: string | null;
}

export type ServerMessage =
  | { type: "STATE"; room: RoomPublic; role: ClientRole; clientId: string }
  | { type: "SLIDE"; page: number; controllerId: string }
  | { type: "CONTROL"; controllerId: string; controllerName: string }
  | { type: "PRESENCE"; clients: PresenceClient[] }
  | { type: "PRESENTER_CONFIG"; pin: string | null }
  | { type: "ERROR"; message: string };

export type ClientMessage =
  | { type: "SLIDE"; page: number }
  | { type: "REQUEST_CONTROL" }
  | { type: "RELEASE_CONTROL" }
  | { type: "SET_ALLOW_TAKE_CONTROL"; allow: boolean }
  | { type: "SET_REQUIRE_NAME"; require: boolean }
  | { type: "SET_PIN"; pin: string | null }
  | { type: "SET_NAME"; name: string };

export interface PresenceClient {
  id: string;
  name: string;
  role: ClientRole;
  isController: boolean;
}

export interface CreateRoomResponse {
  roomId: string;
  presenterToken: string;
  joinUrl: string;
  presenterUrl: string;
}
