import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { AppFooter, TopBar } from "#/components/ui-bits";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin · nyaasift" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { viewer } = Route.useRouteContext();
  if (!viewer.isAdmin) {
    return (
      <div className="page">
        <TopBar viewer={viewer} />
        <main className="wrap" style={{ paddingTop: 64 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Réservé aux admins</h1>
          <p className="text2">
            Cet espace sert à gérer les membres. Demande au super admin si tu dois y accéder
          </p>
          <Link to="/" className="btn">
            Retour à la recherche
          </Link>
        </main>
        <AppFooter viewer={viewer} />
      </div>
    );
  }
  return (
    <div className="page">
      <TopBar viewer={viewer} />
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 32px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: "32px", fontWeight: 500 }}>Admin</h1>
          <nav className="tabs" aria-label="Sections de l'admin">
            <Link to="/admin/membres">Membres</Link>
            {viewer.isSuperAdmin && <Link to="/admin/administrateurs">Administrateurs</Link>}
          </nav>
        </div>
        <Outlet />
      </main>
      <AppFooter viewer={viewer} />
    </div>
  );
}
