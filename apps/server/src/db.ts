import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR =
  process.env.DATA_DIR ?? path.join(__dirname, "..", "data");

mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, "share-slides.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    pdf_path TEXT NOT NULL,
    page_count INTEGER NOT NULL,
    current_page INTEGER NOT NULL DEFAULT 1,
    allow_take_control INTEGER NOT NULL DEFAULT 1,
    require_name INTEGER NOT NULL DEFAULT 0,
    has_pin INTEGER NOT NULL DEFAULT 0,
    pin TEXT,
    presenter_token TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
`);
