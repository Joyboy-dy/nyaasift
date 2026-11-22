/** Variables d'environnement du serveur, lues une fois. */
function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Variable d'environnement manquante : ${name} (voir .env.example)`);
  return v;
}

export const env = {
  appUrl: (process.env.APP_URL ?? "http://localhost:3530").replace(/\/$/, ""),
  authSecret: required("BETTER_AUTH_SECRET"),
  superAdminEmail: required("SUPER_ADMIN_EMAIL").toLowerCase(),
  // Fiche du Chrome Web Store, une fois l'extension publiée (sinon : instructions sur GitHub)
  chromeExtensionUrl: process.env.CHROME_EXTENSION_URL?.trim() || null,
  ipHeader: (process.env.TRUSTED_IP_HEADER ?? "x-forwarded-for").toLowerCase(),
};
