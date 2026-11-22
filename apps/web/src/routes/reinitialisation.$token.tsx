import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthPage, errorText } from "#/components/ui-bits";
import { applyReset, inspectReset } from "#/functions/access";

export const Route = createFileRoute("/reinitialisation/$token")({
  loader: ({ params }) => inspectReset({ data: { token: params.token } }),
  head: () => ({ meta: [{ title: "Nouveau mot de passe · nyaasift" }] }),
  component: Reset,
});

function Reset() {
  const link = Route.useLoaderData();
  const { token } = Route.useParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!link.ok || done) {
    return (
      <AuthPage>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1>{done ? "Mot de passe changé" : link.ok ? "" : link.problem}</h1>
          <p className="text2" style={{ margin: 0 }}>
            {done
              ? "Connecte-toi avec ton nouveau mot de passe"
              : "Demande un nouveau lien à un admin"}
          </p>
        </div>
        <Link to="/connexion" className="btn primary lg">
          Aller à la connexion
        </Link>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1>Nouveau mot de passe</h1>
        <p className="text2" style={{ margin: 0 }}>
          Pour {link.email}. Tes autres sessions seront fermées
        </p>
      </div>
      <form
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await applyReset({ data: { token, password } });
            setDone(true);
          } catch (err) {
            setError(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-field">
          <label htmlFor="pw">Nouveau mot de passe</label>
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
          {busy ? "Enregistrement…" : "Changer le mot de passe"}
        </button>
      </form>
    </AuthPage>
  );
}
