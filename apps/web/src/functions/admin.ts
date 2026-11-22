/** /admin : chaque action revérifie le rôle côté serveur. */
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { auth, authReady } from "#/server/auth";
import { DAY, db, newToken } from "#/server/db";
import { env } from "#/server/env";
import type { Role } from "./viewer";

type Me = { id: string; role: Role };

async function requireRole(min: "admin" | "superadmin"): Promise<Me> {
  await authReady;
  const s = await auth.api.getSession({ headers: getRequestHeaders() });
  const role = ((s?.user as { role?: string } | undefined)?.role ?? "user") as Role;
  const ok = min === "admin" ? role === "admin" || role === "superadmin" : role === "superadmin";
  if (!s || !ok) throw new Error(min === "admin" ? "Réservé aux admins" : "Réservé au super admin");
  return { id: s.user.id, role };
}

type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  banned: number | null;
  lastSeen: number | null;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  banned: boolean;
  lastSeen: number | null;
};
export type PendingInvitation = {
  id: string;
  email: string | null;
  createdAt: number;
  expiresAt: number;
};

export const listMembers = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole("admin");
  const rows = db
    .query<MemberRow, []>(
      `SELECT u.id, u.name, u.email, u.role, u.banned,
              (SELECT max(s.updatedAt) FROM session s WHERE s.userId = u.id) AS lastSeen
       FROM user u ORDER BY u.createdAt`,
    )
    .all();
  const members: Member[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role ?? "user",
    banned: Boolean(r.banned),
    lastSeen: r.lastSeen ? new Date(r.lastSeen).getTime() : null,
  }));
  const invitations = db
    .query<PendingInvitation, [number]>(
      "SELECT id, email, createdAt, expiresAt FROM invitation WHERE usedAt IS NULL AND expiresAt > ? ORDER BY createdAt DESC",
    )
    .all(Date.now());
  const now = Date.now();
  return {
    members,
    invitations: invitations.map((i) => ({
      ...i,
      daysLeft: Math.max(1, Math.ceil((i.expiresAt - now) / 86_400_000)),
    })),
  };
});

const id = z.object({ userId: z.string().min(1).max(100) });

/** Un admin n'agit que sur les membres ; le super admin sur tout le monde sauf lui-même. */
function target(me: Me, userId: string): { role: Role } {
  const row = db
    .query<{ role: Role | null }, [string]>("SELECT role FROM user WHERE id = ?")
    .get(userId);
  if (!row) throw new Error("Ce compte n'existe plus");
  const role = row.role ?? "user";
  if (userId === me.id) throw new Error("Pas sur ton propre compte");
  if (role === "superadmin") throw new Error("Le super admin ne se gère pas ici");
  if (me.role === "admin" && role !== "user")
    throw new Error("Un admin n'agit pas sur un autre admin");
  return { role };
}

export const createInvitation = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().trim().toLowerCase().email().max(200).optional() }))
  .handler(async ({ data }) => {
    const me = await requireRole("superadmin");
    if (data.email) {
      const exists = db.query("SELECT 1 FROM user WHERE lower(email) = ?").get(data.email);
      if (exists) throw new Error("Un compte existe déjà avec cette adresse");
    }
    const { token, hash } = newToken();
    const now = Date.now();
    db.query(
      "INSERT INTO invitation (id, tokenHash, email, createdBy, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(crypto.randomUUID(), hash, data.email ?? null, me.id, now, now + 7 * DAY);
    return { url: `${env.appUrl}/invitation/${token}`, email: data.email ?? null };
  });

export const cancelInvitation = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    await requireRole("superadmin");
    db.query("DELETE FROM invitation WHERE id = ? AND usedAt IS NULL").run(data.id);
    return { ok: true };
  });

export const setBanned = createServerFn({ method: "POST" })
  .validator(id.extend({ banned: z.boolean() }))
  .handler(async ({ data }) => {
    const me = await requireRole("admin");
    target(me, data.userId);
    const headers = getRequestHeaders();
    // banUser ferme aussi toutes ses sessions
    if (data.banned) await auth.api.banUser({ body: { userId: data.userId }, headers });
    else await auth.api.unbanUser({ body: { userId: data.userId }, headers });
    return { ok: true };
  });

export const createResetLink = createServerFn({ method: "POST" })
  .validator(id)
  .handler(async ({ data }) => {
    const me = await requireRole("admin");
    target(me, data.userId);
    const { token, hash } = newToken();
    const now = Date.now();
    db.query(
      "INSERT INTO reset_link (id, tokenHash, userId, createdBy, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(crypto.randomUUID(), hash, data.userId, me.id, now, now + DAY);
    return { url: `${env.appUrl}/reinitialisation/${token}` };
  });

export const removeMember = createServerFn({ method: "POST" })
  .validator(id)
  .handler(async ({ data }) => {
    const me = await requireRole("superadmin");
    target(me, data.userId);
    await auth.api.removeUser({ body: { userId: data.userId }, headers: getRequestHeaders() });
    db.query("DELETE FROM reset_link WHERE userId = ?").run(data.userId);
    return { ok: true };
  });

export const setAdmin = createServerFn({ method: "POST" })
  .validator(id.extend({ admin: z.boolean() }))
  .handler(async ({ data }) => {
    const me = await requireRole("superadmin");
    target(me, data.userId);
    await auth.api.setRole({
      body: { userId: data.userId, role: data.admin ? "admin" : "user" },
      headers: getRequestHeaders(),
    });
    return { ok: true };
  });
