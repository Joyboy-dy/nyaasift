import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  IconKey,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { cx, errorText, relative } from "#/components/ui-bits";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import { avatarUri } from "#/lib/avatar";
import {
  cancelInvitation,
  createInvitation,
  createResetLink,
  listMembers,
  removeMember,
  setBanned,
  type Member,
} from "#/functions/admin";
import type { Viewer } from "#/functions/viewer";

export const Route = createFileRoute("/_app/admin/membres")({
  loader: ({ context }) => (context.viewer.isAdmin ? listMembers() : null),
  component: Members,
});

const ROLE_LABEL = { user: "Membre", admin: "Admin", superadmin: "Super admin" } as const;

function Members() {
  const data = Route.useLoaderData();
  const { viewer } = Route.useRouteContext();
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [link, setLink] = useState<{ label: string; url: string } | null>(null);
  const [error, setError] = useState("");
  if (!data) return null;

  const run = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
      await router.invalidate();
    } catch (e) {
      setError(errorText(e));
    }
  };
  const f = filter.trim().toLowerCase();
  const members = data.members.filter(
    (m) => !f || m.name.toLowerCase().includes(f) || m.email.toLowerCase().includes(f),
  );
  const banned = data.members.filter((m) => m.banned).length;

  return (
    <>
      {viewer.isSuperAdmin && <InviteBox onCreated={(l) => setLink(l)} onError={setError} />}
      {link && (
        <div className="panel" role="status" style={{ borderColor: "var(--ns-line2)" }}>
          <div className="copy-line">
            <span className="text2" style={{ fontSize: 13 }}>
              {link.label}
            </span>
            <code>{link.url}</code>
            <button
              type="button"
              className="btn sm"
              onClick={() => void navigator.clipboard.writeText(link.url)}
            >
              Copier
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p className="text2" style={{ margin: 0 }}>
          Membres ·{" "}
          <span className="mono" style={{ fontSize: 13 }}>
            {data.members.length} comptes · {banned} suspendu{banned > 1 ? "s" : ""} ·{" "}
            {data.invitations.length} invitation{data.invitations.length > 1 ? "s" : ""} en attente
          </span>
        </p>
        <label htmlFor="find" className="sr-only">
          Filtrer les membres
        </label>
        <input
          id="find"
          className="input"
          type="search"
          placeholder="Filtrer"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ height: 36, width: 240, fontSize: 13 }}
        />
      </div>

      <div className="mtbl" role="table" aria-label="Membres">
        <div className="mrow head" role="row">
          <span role="columnheader">Nom</span>
          <span role="columnheader">E-mail</span>
          <span role="columnheader">Rôle</span>
          <span role="columnheader">Statut</span>
          <span role="columnheader">Activité</span>
          <span role="columnheader" style={{ textAlign: "right" }}>
            Actions
          </span>
        </div>
        {members.map((m) => (
          <div key={m.id} className={cx("mrow", m.banned && "off")} role="row">
            <span role="cell" className="cell-name" title={m.name}>
              <img className="avatar sm" src={avatarUri(m.id)} alt="" width={24} height={24} />
              <span>{m.id === viewer.id ? `${m.name} (toi)` : m.name}</span>
            </span>
            <span role="cell" className="cell-mail" title={m.email}>
              {m.email}
            </span>
            <span role="cell" style={{ fontSize: 13 }}>
              {ROLE_LABEL[m.role]}
            </span>
            <span role="cell" className="st">
              <span
                className={cx("dot", m.role === "superadmin" ? "me" : m.banned ? "off" : "ok")}
              />
              {m.banned ? "Suspendu" : "Actif"}
            </span>
            <span role="cell" className="mono muted" style={{ fontSize: 12 }}>
              {relative(m.lastSeen)}
            </span>
            <span role="cell" className="actions">
              <MemberActions m={m} viewer={viewer} run={run} onLink={setLink} />
            </span>
          </div>
        ))}
        {viewer.isSuperAdmin &&
          data.invitations.map((inv) => (
            <div key={inv.id} className="mrow" role="row">
              <span role="cell">—</span>
              <span role="cell" className="cell-mail">
                {inv.email ?? "lien sans e-mail"}
              </span>
              <span role="cell" style={{ fontSize: 13 }}>
                Invité
              </span>
              <span role="cell" className="st">
                <span className="dot sub" />
                Invitation · {inv.daysLeft} j
              </span>
              <span role="cell" className="mono muted" style={{ fontSize: 12 }}>
                créée {relative(inv.createdAt)}
              </span>
              <span role="cell" className="actions">
                <IconAction
                  label="Annuler l'invitation"
                  danger
                  onClick={() => void run(() => cancelInvitation({ data: { id: inv.id } }))}
                >
                  <IconX size={16} stroke={1.5} />
                </IconAction>
              </span>
            </div>
          ))}
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        Suspendre ferme les sessions tout de suite et bloque la connexion, sans rien effacer.
        Retirer supprime le compte. Une invitation ne se montre qu'une fois : copie le lien à sa
        création
      </p>
    </>
  );
}

function MemberActions(props: {
  m: Member;
  viewer: Viewer;
  run: (a: () => Promise<unknown>) => Promise<void>;
  onLink: (l: { label: string; url: string }) => void;
}) {
  const { m, viewer, run } = props;
  if (m.id === viewer.id || m.role === "superadmin") return null;
  if (!viewer.isSuperAdmin && m.role !== "user") return null; // un admin n'agit pas sur un autre admin
  return (
    <>
      <IconAction
        label="Créer un lien de mot de passe"
        onClick={() =>
          void run(async () => {
            const r = await createResetLink({ data: { userId: m.id } });
            props.onLink({
              label: `Lien de mot de passe pour ${m.email} · une seule fois · 24 h`,
              url: r.url,
            });
          })
        }
      >
        <IconKey size={16} stroke={1.5} />
      </IconAction>
      <IconAction
        label={m.banned ? "Réactiver" : "Suspendre"}
        onClick={() => void run(() => setBanned({ data: { userId: m.id, banned: !m.banned } }))}
      >
        {m.banned ? (
          <IconPlayerPlay size={16} stroke={1.5} />
        ) : (
          <IconPlayerPause size={16} stroke={1.5} />
        )}
      </IconAction>
      {viewer.isSuperAdmin && (
        <IconAction
          label="Retirer le compte"
          danger
          onClick={() => {
            if (window.confirm(`Retirer définitivement le compte de ${m.name} ?`))
              void run(() => removeMember({ data: { userId: m.id } }));
          }}
        >
          <IconTrash size={16} stroke={1.5} />
        </IconAction>
      )}
    </>
  );
}

/** Bouton à icône : le libellé sert à la fois d'infobulle et de nom pour les lecteurs d'écran. */
function IconAction(props: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cx("icon-btn", props.danger && "danger")}
            aria-label={props.label}
            onClick={props.onClick}
          >
            {props.children}
          </button>
        }
      />
      <TooltipContent>{props.label}</TooltipContent>
    </Tooltip>
  );
}

function InviteBox({
  onCreated,
  onError,
}: {
  onCreated: (l: { label: string; url: string }) => void;
  onError: (e: string) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel"
      aria-labelledby="inv"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end",
        borderColor: "var(--ns-line2)",
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        onError("");
        try {
          const r = await createInvitation({ data: { email: email.trim() || undefined } });
          onCreated({
            label: `Lien créé${r.email ? ` pour ${r.email}` : ""} · une seule fois · 7 jours`,
            url: r.url,
          });
          setEmail("");
          await router.invalidate();
        } catch (err) {
          onError(errorText(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-field" style={{ flex: "1 1 320px" }}>
        <label id="inv" htmlFor="invmail">
          Inviter quelqu'un · e-mail facultatif, le lien ne marchera qu'avec lui
        </label>
        <input
          id="invmail"
          className="input"
          type="email"
          placeholder="ami@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ height: 40 }}
        />
      </div>
      <button type="submit" className="btn primary" disabled={busy}>
        <IconPlus size={16} stroke={1.5} aria-hidden="true" />
        Créer un lien d'invitation
      </button>
    </form>
  );
}
