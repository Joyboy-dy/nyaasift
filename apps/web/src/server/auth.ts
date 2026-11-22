import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getMigrations } from "better-auth/db/migration";
import { db } from "./db";
import { env } from "./env";

/**
 * Droits du plugin admin, restreints à ce que /admin permet :
 * un admin suspend et voit les membres ; seul le super admin invite, retire et nomme.
 * (Sans cette restriction, un admin pourrait appeler /api/auth/admin/* directement.)
 */
const ac = createAccessControl(defaultStatements);
const roles = {
  user: ac.newRole({ user: [], session: [] }),
  admin: ac.newRole({ user: ["list", "get", "ban"], session: ["list", "revoke"] }),
  superadmin: ac.newRole({
    user: [...defaultStatements.user],
    session: [...defaultStatements.session],
  }),
};

/** E-mails autorisés à créer un compte, le temps d'une invitation ou du premier lancement. */
export const allowedSignups = new Set<string>();

export const auth = betterAuth({
  database: db,
  secret: env.authSecret,
  baseURL: env.appUrl,
  emailAndPassword: { enabled: true, minPasswordLength: 12, autoSignIn: true },
  rateLimit: { enabled: true, window: 60, max: 30 },
  // IP du visiteur pour la limite de connexion : posée par le proxy TLS. Le conteneur n'écoute que sur
  // 127.0.0.1 (deploy/compose.yaml), donc personne d'autre ne peut fabriquer cet en-tête.
  advanced: { ipAddress: { ipAddressHeaders: [env.ipHeader] } },
  plugins: [
    admin({ ac, roles, defaultRole: "user", adminRoles: ["admin", "superadmin"] }),
    tanstackStartCookies(), // toujours en dernier
  ],
  hooks: {
    // Inscription fermée depuis le navigateur : les comptes naissent seulement côté serveur.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" && ctx.request) {
        throw new APIError("FORBIDDEN", { message: "Inscription sur invitation seulement" });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) =>
          allowedSignups.has(user.email.toLowerCase()) ? { data: user } : false,
      },
    },
  },
});

/** Tables de Better Auth, et rôle super admin aligné sur SUPER_ADMIN_EMAIL (jamais modifiable ailleurs). */
export const authReady: Promise<void> = (async () => {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  db.query(`UPDATE user SET role = 'admin' WHERE role = 'superadmin' AND lower(email) <> ?`).run(
    env.superAdminEmail,
  );
  db.query(`UPDATE user SET role = 'superadmin' WHERE lower(email) = ?`).run(env.superAdminEmail);
})();

export function userCount(): number {
  return db.query<{ n: number }, []>("SELECT count(*) AS n FROM user").get()?.n ?? 0;
}
