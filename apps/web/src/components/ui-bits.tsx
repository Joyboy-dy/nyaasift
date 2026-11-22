import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { IconChevronDown, IconLogout, IconSearch, IconShieldLock } from "@tabler/icons-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { Viewer } from "#/functions/viewer";
import { authClient } from "#/lib/auth-client";
import { avatarUri } from "#/lib/avatar";

export function Brand() {
  return (
    <Link to="/" className="brand">
      nyaa<span>sift</span>
    </Link>
  );
}

/** Barre du haut des pages connectées : logo (= accueil), recherche, menu du compte. */
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
            <span className="btn-label">Chercher</span>
          </button>
        </form>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger className="account" aria-label={`Compte de ${viewer.name}`}>
          <img className="avatar" src={avatarUri(viewer.id)} alt="" width={32} height={32} />
          <span className="account-who">
            <b>{viewer.name}</b>
            <small>{roleLabel(viewer)}</small>
          </span>
          <IconChevronDown size={16} stroke={1.5} aria-hidden="true" className="muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-64">
          <div className="menu-head">
            <b>{viewer.name}</b>
            <span>{viewer.email}</span>
            <span>{roleLabel(viewer)}</span>
          </div>
          <DropdownMenuSeparator />
          {viewer.isAdmin && (
            <DropdownMenuItem onClick={() => void navigate({ to: "/admin/membres" })}>
              <IconShieldLock size={16} stroke={1.5} aria-hidden="true" />
              Administration
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={async () => {
              await authClient.signOut();
              await router.invalidate();
              await navigate({ to: "/connexion" });
            }}
          >
            <IconLogout size={16} stroke={1.5} aria-hidden="true" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function roleLabel(v: Viewer): string {
  return v.isSuperAdmin ? "super admin" : v.isAdmin ? "admin" : "membre";
}

/** Pied de page léger : copyright, recherche, admin. */
export function AppFooter({ viewer }: { viewer: Viewer }) {
  return (
    <footer className="foot">
      <span>© 2026 nyaasift · open source · ne télécharge rien, donne les liens vers Nyaa</span>
      <nav aria-label="Pied de page">
        <Link to="/" activeOptions={{ exact: true }}>
          Recherche
        </Link>
        {viewer.isAdmin && <Link to="/admin/membres">Admin</Link>}
      </nav>
    </footer>
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
  if (!ts) return "—"; // aucune session ouverte (jamais connecté, ou sessions fermées par une suspension)
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

/** Assemble des classes CSS. (Le plugin Prettier de Tailwind retire les espaces dans les classes écrites en gabarit.) */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
