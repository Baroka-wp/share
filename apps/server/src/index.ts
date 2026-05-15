import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import pdf from "pdf-parse";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import {
  MAX_PDF_BYTES,
  type PresenceClient,
  type ServerMessage,
} from "@share-slides/shared";
import {
  createRoom,
  getRoom,
  toPublic,
  verifyPin,
  verifyPresenterToken,
} from "./rooms.js";
import { attachSocketHandlers } from "./socket.js";
import type { ConnectedClient } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const PORT = Number(process.env.PORT) || 3001;
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:5173";

await mkdir(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(
  cors({
    origin: [WEB_ORIGIN, "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 120 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${uuid()}-${safe}`);
    },
  }),
  limits: { fileSize: MAX_PDF_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

function publicBaseUrl(req: express.Request): string {
  return process.env.PUBLIC_URL || WEB_ORIGIN;
}

app.post("/api/rooms", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "PDF file is required" });
      return;
    }

    const buffer = await readFile(req.file.path);
    const parsed = await pdf(buffer);
    const pageCount = parsed.numpages || 1;
    const title =
      (typeof req.body.title === "string" && req.body.title.trim()) ||
      req.file.originalname.replace(/\.pdf$/i, "") ||
      "Presentation";

    const pin =
      typeof req.body.pin === "string" && req.body.pin.trim()
        ? req.body.pin.trim()
        : null;

    const room = createRoom({
      title,
      pdfPath: req.file.filename,
      pageCount,
      pin,
    });

    const base = publicBaseUrl(req);
    res.status(201).json({
      roomId: room.id,
      presenterToken: room.presenterToken,
      joinUrl: `${base}/j/${room.id}`,
      presenterUrl: `${base}/j/${room.id}?t=${room.presenterToken}`,
      room: toPublic(room),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.get("/api/rooms/:roomId", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found or expired" });
    return;
  }
  res.json({ room: toPublic(room) });
});

app.post("/api/rooms/:roomId/verify-pin", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found or expired" });
    return;
  }
  const pin = typeof req.body.pin === "string" ? req.body.pin : null;
  res.json({ ok: verifyPin(room, pin) });
});

app.get("/api/rooms/:roomId/pdf", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found or expired" });
    return;
  }

  const pin = typeof req.query.pin === "string" ? req.query.pin : null;
  const token =
    typeof req.query.t === "string"
      ? req.query.t
      : typeof req.headers["x-presenter-token"] === "string"
        ? req.headers["x-presenter-token"]
        : null;

  if (!verifyPin(room, pin) && !verifyPresenterToken(room, token)) {
    res.status(403).json({ error: "PIN or presenter token required" });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, room.pdfPath);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: "PDF not found" });
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [WEB_ORIGIN, "http://localhost:5173"],
    credentials: true,
  },
});

const clientsBySocket = new Map<string, ConnectedClient>();

function broadcastPresence(roomId: string): void {
  const list: PresenceClient[] = [];
  for (const client of clientsBySocket.values()) {
    if (client.roomId !== roomId) continue;
    list.push({
      id: client.id,
      name: client.name,
      role: client.role,
      isController: client.isController,
    });
  }
  const msg: ServerMessage = { type: "PRESENCE", clients: list };
  io.to(roomId).emit("message", msg);
}

attachSocketHandlers({
  io,
  clientsBySocket,
  broadcastPresence,
  getRoom,
  toPublic,
  verifyPin,
  verifyPresenterToken,
});

httpServer.listen(PORT, () => {
  console.log(`Share Slides server on http://localhost:${PORT}`);
});
