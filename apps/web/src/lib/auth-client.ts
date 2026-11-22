import { createAuthClient } from "better-auth/react";

/** Connexion et déconnexion depuis le navigateur ; tout le reste passe par des fonctions serveur. */
export const authClient = createAuthClient();
