# syntax=docker/dockerfile:1.7
#
# nyaasift : image de production du site privé. Le contexte de build est la racine du dépôt :
#   docker build -f deploy/Dockerfile --target web -t nyaasift-web .
# Filtre du contexte : deploy/Dockerfile.dockerignore. L'app est regroupée en fichiers uniques :
# l'image finale n'a pas de node_modules. La base SQLite vit dans le volume /app/data.

ARG BUN_VERSION=1

FROM oven/bun:${BUN_VERSION}-slim AS runtime

# ── Dépendances (en cache tant que les manifestes et le lockfile ne changent pas) ─────────
FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/extension/package.json apps/extension/
COPY packages/shared/package.json packages/shared/
# --ignore-scripts : le « wxt prepare » de l'extension n'a rien à faire ici, ses sources ne sont pas copiées
RUN bun install --frozen-lockfile --ignore-scripts

# ── Build du site seulement (l'extension se construit à part, avec `bun run --cwd apps/extension zip`) ──
FROM deps AS build
COPY . .
RUN bun run --cwd apps/web build

# ── Site ─────────────────────────────────────────────────────────────────────────────────
FROM runtime AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/app/data/nyaasift.sqlite
COPY --from=build --chown=bun:bun /repo/apps/web/dist ./dist
RUN mkdir -p /app/data && chown bun:bun /app/data
USER bun
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD ["bun", "-e", "const r = await fetch('http://127.0.0.1:' + (process.env.PORT ?? 3000) + '/connexion'); process.exit(r.status < 500 ? 0 : 1)"]
CMD ["bun", "dist/serve.js"]
