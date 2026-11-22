import { createFileRoute } from "@tanstack/react-router";

const APP_NAME = "nyaasift";

export const Route = createFileRoute("/")({ component: Welcome });

/** Welcome page laid down by Groundwork: replace it with the product's home. */
function Welcome() {
  return (
    <main
      data-groundwork-welcome
      className="grid min-h-svh place-items-center bg-background p-6 text-foreground"
    >
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Bienvenue sur {APP_NAME}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Le projet est prêt. Le développement commence ici.
        </p>
      </div>
    </main>
  );
}
