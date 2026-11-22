import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthPage, errorText } from "#/components/ui-bits";
import { firstLaunch, setupStatus } from "#/functions/access";

export const Route = createFileRoute("/premier-lancement")({
  beforeLoad: ({ context }) => {
    if (!context.needsSetup) throw redirect({ to: context.viewer ? "/" : "/connexion" });
  },
  loader: () => setupStatus(),
  head: () => ({ meta: [{ title: "Premier lancement · nyaasift" }] }),
  component: FirstLaunch,
});

function FirstLaunch() {
  const { email } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthPage>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p className="mono muted" style={{ margin: 0, fontSize: 12 }}>
          premier lancement
        </p>
        <h1>Crée le compte super admin</h1>
        <p className="text2" style={{ margin: 0 }}>
          Seul l'e-mail défini dans SUPER_ADMIN_EMAIL peut créer ce compte. Ensuite, on n'entre que
          sur invitation
        </p>
      </div>
      <form
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await firstLaunch({ data: { name, password } });
            await router.invalidate();
            await navigate({ to: "/admin/membres" });
          } catch (err) {
            setError(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-field">
          <label htmlFor="email">E-mail du super admin</label>
          <input id="email" className="input" type="email" value={email} readOnly />
          <span className="hint">Lu dans la configuration du serveur</span>
        </div>
        <div className="form-field">
          <label htmlFor="name">Nom affiché</label>
          <input
            id="name"
            className="input"
            autoComplete="nickname"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="pw">Mot de passe</label>
          <input
            id="pw"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="hint">12 caractères au moins</span>
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn primary lg" disabled={busy}>
          {busy ? "Création…" : "Créer et ouvrir l'admin"}
        </button>
      </form>
      <p className="auth-foot">Cette page disparaît dès que le compte existe</p>
    </AuthPage>
  );
}
