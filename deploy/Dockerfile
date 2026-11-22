# syntax=docker/dockerfile:1.7
#
# nyaasift production images. The build context is the repository root:
#   docker build -f deploy/Dockerfile --target web -t nyaasift-web .
# The context filter is deploy/Dockerfile.dockerignore (read next to this file).
# Apps are bundled into single files: the runtime stages carry no node_modules.

ARG BUN_VERSION=1

FROM oven/bun:${BUN_VERSION}-slim AS runtime

# ── Dependencies (cached while manifests and lockfile are unchanged) ─────────────────────
FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN bun run build

# ── Web runtime ──────────────────────────────────────────────────────────────────────────
FROM runtime AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=bun:bun /repo/apps/web/dist ./dist
USER bun
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD ["bun", "-e", "const r = await fetch('http://127.0.0.1:' + (process.env.PORT ?? 3000) + '/'); process.exit(r.ok ? 0 : 1)"]
CMD ["bun", "dist/serve.js"]
