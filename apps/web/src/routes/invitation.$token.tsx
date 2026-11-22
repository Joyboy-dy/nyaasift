import { Link, createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthPage, errorText } from "#/components/ui-bits";
import { acceptInvitation, inspectInvitation } from "#/functions/access";

export const Route = createFileRoute("/invitation/$token")({
  beforeLoad: ({ context }) => {
    if (context.viewer) throw redirect({ to: "/" });
  },
  loader: ({ params }) => inspectInvitation({ data: { token: params.token } }),
  head: () => ({ meta: [{ title: "Invitation · nyaasift" }] }),
  component: Invitation,
});

function Invitation() {
  const inv = Route.useLoaderData();
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(inv.ok ? (inv.email ?? "") : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!inv.ok) {
    return (
      <AuthPage>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1>{inv.problem}</h1>
          <p className="text2" style={{ margin: 0 }}>
            Demande un nouveau lien à la personne qui t'a invité
          </p>
        </div>
        <Link to="/connexion" className="btn">
          Aller à la connexion
        </Link>
      </AuthPage>
    );
  }

  const { daysLeft } = inv;
  return (
    <AuthPage>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p className="mono muted" style={{ margin: 0, fontSize: 12 }}>
          invitation · valable encore {daysLeft} jour{daysLeft > 1 ? "s" : ""}
        </p>
        <h1>Tu es invité sur ce nyaasift</h1>
        <p className="text2" style={{ margin: 0 }}>
          Choisis ton nom et ton mot de passe, tu arrives directement sur la recherche
        </p>
      </div>
      <form
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await acceptInvitation({ data: { token, name, email, password } });
            await router.invalidate();
            await navigate({ to: "/" });
          } catch (err) {
            setError(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
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
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            readOnly={Boolean(inv.email)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {inv.email && <span className="hint">Cette invitation est liée à cette adresse</span>}
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
          {busy ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="auth-foot">
        Lien expiré ou déjà utilisé ? Demande un nouveau lien à la personne qui t'a invité
      </p>
    </AuthPage>
  );
}
