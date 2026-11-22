# Environment files

## Files

| File                      | Committed | Content                                                      |
| ------------------------- | --------- | ------------------------------------------------------------ |
| `.env.example`            | yes       | Every variable used by the project, example values only.     |
| `deploy/.env.production.example` | yes       | Only what is really configurable in production (kept light). |
| `.env.local`              | **no**    | Real local values (development).                             |
| `deploy/.env.prod`        | **no**    | Real production values, on the server only.                  |

`.gitignore` ignores `.env` and `.env.*`, except the `*.example` files. `bun run check:env`
fails if a real environment file is tracked by git or if a value looks like a real secret.

## Loading and validation

- Development scripts load the root `.env.local` explicitly (`bun --env-file=…`).
- Every app validates its environment at startup with a schema and exits with a readable list
  of problems. Add every new variable to that schema **and** to `.env.example`, plus
  `.env.production.example` if it matters in production.

## Production rule

- `deploy/compose.yaml` carries most non-sensitive variables and their defaults (ports,
  internal URLs, SMTP defaults…).
- Production environment files mainly contain secrets, environment-dependent values and
  feature flags.
- A value provided by the environment always overrides the `deploy/compose.yaml` default.

## Never

- Commit a real value, even a "temporary" one.
- Display an environment variable name in the UI.
- Read secrets from the browser: only server code reads `process.env`.
