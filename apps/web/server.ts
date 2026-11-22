/*
 * Production server of the web app (Bun). Serves the built client assets from dist/client and
 * hands every other request to the TanStack Start handler (SSR, server functions, /api/*).
 *
 * Bundled with its dependencies by `bun run build` into dist/serve.js, so the runtime image
 * needs no node_modules. Excluded from the app's tsconfig: dist/ only exists after a build.
 */
import { join, normalize, sep } from "node:path";
import handler from "./dist/server/server.js";

const port = Number(process.env.PORT ?? 3000);
const clientDir = join(import.meta.dir, "client");
const https = process.env.APP_URL?.startsWith("https://") ?? false;

/** Security headers on every response (no script policy: SSR injects inline scripts). */
const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy":
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  ...(https ? { "strict-transport-security": "max-age=31536000" } : {}),
};

function secured(response: Response): Response {
  const result = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!result.headers.has(name)) result.headers.set(name, value);
  }
  return result;
}

/** A file of dist/client for this path, or null (never outside the directory). */
async function staticFile(pathname: string) {
  if (pathname === "/" || pathname.endsWith("/")) return null;
  const path = normalize(join(clientDir, decodeURIComponent(pathname)));
  if (!path.startsWith(clientDir + sep)) return null;
  const file = Bun.file(path);
  return (await file.exists()) ? file : null;
}

Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (request.method === "GET" || request.method === "HEAD") {
      const file = await staticFile(pathname);
      if (file) {
        // Hashed build assets never change; other public files are revalidated.
        const immutable = pathname.startsWith("/assets/");
        return secured(
          new Response(file, {
            headers: {
              "cache-control": immutable
                ? "public, max-age=31536000, immutable"
                : "public, max-age=3600",
            },
          }),
        );
      }
    }
    return secured(await handler.fetch(request));
  },
  error(error) {
    console.error(error);
    return new Response("Internal server error.", { status: 500 });
  },
});

console.info(`Web app listening on http://localhost:${port}`);
