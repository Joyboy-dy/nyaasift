import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { getViewer } from "#/functions/viewer";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  // Qui est connecté : lu à chaque navigation, transmis aux routes par le contexte
  beforeLoad: async () => getViewer(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "noindex, nofollow" },
      { title: "nyaasift" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <main
      className="wrap"
      style={{
        paddingTop: 96,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <p className="mono muted" style={{ margin: 0 }}>
        404
      </p>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Cette page n'existe pas</h1>
      <a href="/" className="btn">
        Retour à la recherche
      </a>
    </main>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
