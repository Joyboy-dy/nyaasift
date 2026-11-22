import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Un seul fichier SQLite pour tout le site privé (comptes, sessions, invitations, liens). */
const path = resolve(process.env.DATABASE_PATH ?? "data/nyaasift.sqlite");
mkdirSync(dirname(path), { recursive: true });

export const db = new Database(path, { create: true });
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

// Nos deux tables ; celles de Better Auth sont créées par ses migrations (auth.ts).
db.exec(`
  CREATE TABLE IF NOT EXISTS invitation (
    id TEXT PRIMARY KEY,
    tokenHash TEXT NOT NULL UNIQUE,
    email TEXT,
    createdBy TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL,
    usedAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS reset_link (
    id TEXT PRIMARY KEY,
    tokenHash TEXT NOT NULL UNIQUE,
    userId TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL,
    usedAt INTEGER
  );
`);

/** Jeton à usage unique : on ne garde que son empreinte. */
export function newToken(): { token: string; hash: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const token = Buffer.from(bytes).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

export const DAY = 24 * 60 * 60 * 1000;
