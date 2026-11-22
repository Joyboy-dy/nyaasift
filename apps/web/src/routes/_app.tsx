import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

/** Tout ce qui est sous _app exige une session. */
export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context, location }) => {
    if (context.needsSetup) throw redirect({ to: "/premier-lancement" });
    if (!context.viewer) throw redirect({ to: "/connexion", search: { retour: location.href } });
    return { viewer: context.viewer };
  },
  component: Outlet,
});
