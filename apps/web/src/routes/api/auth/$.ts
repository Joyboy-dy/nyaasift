import { createFileRoute } from "@tanstack/react-router";
import { auth, authReady } from "#/server/auth";

async function handle({ request }: { request: Request }) {
  await authReady;
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handle, POST: handle } },
});
