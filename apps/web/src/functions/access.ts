/** Premier lancement, invitations, liens de réinitialisation : là où naissent les comptes. */
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { allowedSignups, auth, authReady, userCount } from "#/server/auth";
import { db, hashToken } from "#/server/db";
import { env } from "#/server/env";

const password = z.string().min(12, "12 caractères au moins").max(128, "128 caractères au plus");
const name = z.string().trim().min(1, "Choisis un nom").max(60, "60 caractères au plus");
const email = z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(200);
const token = z.string().min(10).max(100);

/** Crée un compte côté serveur pour un e-mail autorisé, et ouvre sa session (cookie posé par tanstackStartCookies). */
async function createAccount(input: { email: string; name: string; password: string }) {
  allowedSignups.add(input.email);
  try {
    await auth.api.signUpEmail({ body: input, headers: getRequestHeaders() });
  } finally {
    allowedSignups.delete(input.email);
  }
}

export const setupStatus = createServerFn({ method: "GET" }).handler(async () => {
  await authReady;
  return { needsSetup: userCount() === 0, email: env.superAdminEmail };
});

export const firstLaunch = createServerFn({ method: "POST" })
  .validator(z.object({ name, password }))
  .handler(async ({ data }) => {
    await authReady;
    if (userCount() > 0) throw new Error("Le site a déjà un super admin");
    await createAccount({ email: env.superAdminEmail, name: data.name, password: data.password });
    db.query("UPDATE user SET role = 'superadmin' WHERE lower(email) = ?").run(env.superAdminEmail);
    return { ok: true };
  });

type InvitationRow = { id: string; email: string | null; expiresAt: number; usedAt: number | null };

function findInvitation(t: string): InvitationRow | null {
  return db
    .query<InvitationRow, [string]>(
      "SELECT id, email, expiresAt, usedAt FROM invitation WHERE tokenHash = ?",
    )
    .get(hashToken(t));
}

function invitationProblem(inv: InvitationRow | null): string | null {
  if (!inv) return "Ce lien d'invitation n'existe pas";
  if (inv.usedAt) return "Ce lien d'invitation a déjà servi";
  if (inv.expiresAt < Date.now()) return "Ce lien d'invitation a expiré";
  return null;
}

export const inspectInvitation = createServerFn({ method: "GET" })
  .validator(z.object({ token }))
  .handler(async ({ data }) => {
    await authReady;
    const inv = findInvitation(data.token);
    const problem = invitationProblem(inv);
    return problem
      ? { ok: false as const, problem }
      : {
          ok: true as const,
          email: inv?.email ?? null,
          // calculé ici : un composant React ne doit pas lire l'heure pendant son rendu
          daysLeft: Math.max(1, Math.ceil(((inv?.expiresAt ?? 0) - Date.now()) / 86_400_000)),
        };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .validator(z.object({ token, name, email, password }))
  .handler(async ({ data }) => {
    await authReady;
    const inv = findInvitation(data.token);
    const problem = invitationProblem(inv);
    if (problem || !inv) throw new Error(problem ?? "Lien invalide");
    if (inv.email && inv.email !== data.email)
      throw new Error("Cette invitation est réservée à une autre adresse");
    if (data.email === env.superAdminEmail)
      throw new Error("Cette adresse est réservée au super admin");
    const taken = db.query("SELECT 1 FROM user WHERE lower(email) = ?").get(data.email);
    if (taken) throw new Error("Un compte existe déjà avec cette adresse");
    // marque le lien comme utilisé avant de créer le compte : pas de double usage
    const used = db
      .query("UPDATE invitation SET usedAt = ? WHERE id = ? AND usedAt IS NULL")
      .run(Date.now(), inv.id);
    if (used.changes === 0) throw new Error("Ce lien d'invitation a déjà servi");
    try {
      await createAccount({ email: data.email, name: data.name, password: data.password });
    } catch (e) {
      db.query("UPDATE invitation SET usedAt = NULL WHERE id = ?").run(inv.id); // le lien reste valable
      throw e;
    }
    return { ok: true };
  });

type ResetRow = { id: string; userId: string; expiresAt: number; usedAt: number | null };

function findReset(t: string): ResetRow | null {
  return db
    .query<ResetRow, [string]>(
      "SELECT id, userId, expiresAt, usedAt FROM reset_link WHERE tokenHash = ?",
    )
    .get(hashToken(t));
}

function resetProblem(r: ResetRow | null): string | null {
  if (!r) return "Ce lien n'existe pas";
  if (r.usedAt) return "Ce lien a déjà servi";
  if (r.expiresAt < Date.now()) return "Ce lien a expiré, demande-en un nouveau";
  return null;
}

export const inspectReset = createServerFn({ method: "GET" })
  .validator(z.object({ token }))
  .handler(async ({ data }) => {
    await authReady;
    const r = findReset(data.token);
    const problem = resetProblem(r);
    if (problem || !r) return { ok: false as const, problem: problem ?? "Lien invalide" };
    const user = db
      .query<{ email: string }, [string]>("SELECT email FROM user WHERE id = ?")
      .get(r.userId);
    return { ok: true as const, email: user?.email ?? "" };
  });

export const applyReset = createServerFn({ method: "POST" })
  .validator(z.object({ token, password }))
  .handler(async ({ data }) => {
    await authReady;
    const r = findReset(data.token);
    const problem = resetProblem(r);
    if (problem || !r) throw new Error(problem ?? "Lien invalide");
    const used = db
      .query("UPDATE reset_link SET usedAt = ? WHERE id = ? AND usedAt IS NULL")
      .run(Date.now(), r.id);
    if (used.changes === 0) throw new Error("Ce lien a déjà servi");
    const ctx = await auth.$context;
    await ctx.internalAdapter.updatePassword(r.userId, await ctx.password.hash(data.password));
    await ctx.internalAdapter.deleteUserSessions(r.userId); // toutes ses sessions sont fermées
    return { ok: true };
  });
