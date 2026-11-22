import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import type { Viewer } from "#/functions/viewer";
import { authClient } from "#/lib/auth-client";

export function Brand() {
  return (
    <Link to="/" className="brand">
      nyaa<span>sift</span>
    </Link>
  );
}

/** Barre du haut des pages connectées : logo, recherche, navigation, rôle, déconnexion. */
export function TopBar({ viewer, query }: { viewer: Viewer; query?: string }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [q, setQ] = useState(query ?? "");
  return (
    <header className="top">
      <Brand />
      {query !== undefined && (
        <form
          className="top-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim())
              void navigate({
                to: "/recherche",
                search: (s) => ({ ...s, q: q.trim(), anilist: undefined }),
              });
          }}
        >
          <label htmlFor="top-q" className="sr-only">
            Titre de l'anime
          </label>
          <input
            id="top-q"
            className="input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn primary">
            <IconSearch size={16} stroke={1.5} aria-hidden="true" />
            Chercher
          </button>
        </form>
      )}
      <nav className="nav" aria-label="Navigation">
        <Link to="/" activeOptions={{ exact: true }}>
          Recherche
        </Link>
        {viewer.isAdmin && <Link to="/admin/membres">Admin</Link>}
      </nav>
      <span className="top-end">
        {viewer.isAdmin && (
          <span className="role-tag">{viewer.isSuperAdmin ? "super admin" : "admin"}</span>
        )}
        <span>{viewer.name}</span>
        <button
          type="button"
          className="link"
          onClick={async () => {
            await authClient.signOut();
            await router.invalidate();
            await navigate({ to: "/connexion" });
          }}
        >
          Déconnexion
        </button>
      </span>
    </header>
  );
}

export function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <header className="top" style={{ background: "transparent", borderBottom: 0 }}>
        <span className="brand">
          nyaa<span>sift</span>
        </span>
      </header>
      <main>
        <div className="auth-box">{children}</div>
      </main>
    </div>
  );
}

/** Message d'erreur lisible, quelle que soit la forme de l'erreur. */
export function errorText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "object" && e && "message" in e && typeof e.message === "string")
    return e.message;
  return "Quelque chose n'a pas marché, réessaie";
}

export function formatDate(iso: string | number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function relative(ts: number | null): string {
  if (!ts) return "jamais";
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 2) return "maintenant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "hier";
  if (d < 30) return `il y a ${d} j`;
  return `il y a ${Math.round(d / 30)} mois`;
}
