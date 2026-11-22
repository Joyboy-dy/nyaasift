import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { errorText } from "#/components/ui-bits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { listMembers, setAdmin } from "#/functions/admin";

export const Route = createFileRoute("/_app/admin/administrateurs")({
  beforeLoad: ({ context }) => {
    if (!context.viewer.isSuperAdmin) throw redirect({ to: "/admin/membres" });
  },
  loader: () => listMembers(),
  component: Admins,
});

function Admins() {
  const { members } = Route.useLoaderData();
  const router = useRouter();
  const [error, setError] = useState("");
  const candidates = members.filter((m) => m.role === "user" && !m.banned);
  const [pick, setPick] = useState("");
  const admins = members.filter((m) => m.role !== "user");

  const run = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
      await router.invalidate();
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
        gap: 24,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="panel" style={{ padding: 0 }}>
          {admins.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px 16px",
                minHeight: 60,
                padding: "12px 16px",
                borderTop: i ? "1px solid var(--ns-line)" : 0,
              }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 500 }}>
                  {m.name} · {m.role === "superadmin" ? "super admin" : "admin"}
                </span>
                <span className="mono muted" style={{ fontSize: 13 }}>
                  {m.email}
                </span>
              </div>
              {m.role === "superadmin" ? (
                <span className="mono muted" style={{ fontSize: 12 }}>
                  défini par SUPER_ADMIN_EMAIL, non modifiable ici
                </span>
              ) : (
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => void run(() => setAdmin({ data: { userId: m.id, admin: false } }))}
                >
                  Retirer le rôle
                </button>
              )}
            </div>
          ))}
        </div>
        <form
          className="panel"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}
          onSubmit={(e) => {
            e.preventDefault();
            if (pick) void run(() => setAdmin({ data: { userId: pick, admin: true } }));
          }}
        >
          <div className="form-field" style={{ flex: "1 1 280px" }}>
            <span id="who-label" className="fg-label" style={{ fontSize: 13 }}>
              Nommer un membre admin
            </span>
            <Select
              items={candidates.map((m) => ({ value: m.id, label: `${m.name} · ${m.email}` }))}
              value={pick || null}
              onValueChange={(v) => setPick(v ?? "")}
            >
              <SelectTrigger
                aria-labelledby="who-label"
                className="ns-select"
                style={{ height: 40, width: "100%" }}
              >
                <SelectValue
                  placeholder={candidates.length ? "Choisis un membre" : "Aucun membre à nommer"}
                />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {candidates.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button type="submit" className="btn" disabled={!pick}>
            Nommer admin
          </button>
        </form>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
      <aside className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Ce que peut faire un admin</h2>
        <ul
          className="text2"
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 13,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <li>Suspendre et réactiver un membre</li>
          <li>Fermer ses sessions</li>
          <li>Créer un lien de mot de passe</li>
        </ul>
        <h2 style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>Réservé au super admin</h2>
        <ul
          className="text2"
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 13,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <li>Inviter quelqu'un</li>
          <li>Retirer un compte</li>
          <li>Nommer ou retirer un admin</li>
        </ul>
      </aside>
    </div>
  );
}
