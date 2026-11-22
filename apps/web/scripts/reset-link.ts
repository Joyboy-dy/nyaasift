/**
 * Lien de réinitialisation de mot de passe, créé sur le serveur (super admin qui a perdu le sien).
 *   bun run admin:reset-link toi@exemple.fr                       (développement)
 *   docker compose exec web bun dist/reset-link.js toi@exemple.fr   (production)
 * Lit DATABASE_PATH et APP_URL ; le lien sert une fois, pendant 24 h.
 */
import { Database } from "bun:sqlite";
import { resolve } from "node:path";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage : admin:reset-link <email>");
  process.exit(2);
}

const db = new Database(resolve(process.env.DATABASE_PATH ?? "data/nyaasift.sqlite"));
const user = db
  .query<{ id: string }, [string]>("SELECT id FROM user WHERE lower(email) = ?")
  .get(email);
if (!user) {
  console.error(`Aucun compte pour ${email}`);
  process.exit(1);
}

const token = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url");
const hash = new Bun.CryptoHasher("sha256").update(token).digest("hex");
const now = Date.now();
db.query(
  "INSERT INTO reset_link (id, tokenHash, userId, createdBy, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)",
).run(crypto.randomUUID(), hash, user.id, "serveur", now, now + 24 * 60 * 60 * 1000);

const base = (process.env.APP_URL ?? "http://localhost:3530").replace(/\/$/, "");
console.info(`Lien valable 24 h, une seule fois :\n${base}/reinitialisation/${token}`);
