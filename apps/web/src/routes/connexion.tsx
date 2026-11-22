import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthPage } from "#/components/ui-bits";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/connexion")({
  validateSearch: z.object({
    retour: z.string().startsWith("/").max(500).optional().catch(undefined),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.needsSetup) throw redirect({ to: "/premier-lancement" });
    if (context.viewer) throw redirect({ href: search.retour ?? "/" });
  },
  head: () => ({ meta: [{ title: "Connexion · nyaasift" }] }),
  component: SignIn,
});

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou mot de passe incorrect",
  BANNED_USER: "Ce compte est suspendu, vois avec un admin",
};

function SignIn() {
  const { retour } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthPage>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1>Connexion</h1>
        <p className="text2" style={{ margin: 0 }}>
          Ce nyaasift est privé, ouvert sur invitation
        </p>
      </div>
      <form
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const { error: err } = await authClient.signIn.email({ email, password });
          setBusy(false);
          if (err) {
            setError(MESSAGES[err.code ?? ""] ?? err.message ?? "Connexion impossible, réessaie");
            return;
          }
          await router.invalidate();
          await navigate({ href: retour ?? "/" });
        }}
      >
        <div className="form-field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="pw">Mot de passe</label>
          <input
            id="pw"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn primary lg" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="auth-foot">
        Pas de compte ? Demande un lien d'invitation au super admin de ce nyaasift. Mot de passe
        perdu ? Un admin peut te créer un lien. L'extension marche sans compte
      </p>
    </AuthPage>
  );
}
