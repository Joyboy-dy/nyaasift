# AGENTS.md — nyaasift

Durable rules for coding agents working on this repository. This file is a map: details live in
`.agents/` and in the canonical docs listed below. Keep it between 120 and 150 lines (200 at most):
condense and move details to `.agents/` rather than dropping a rule.

## Project

nyaasift: Tape le titre comme il te vient : nyaasift retrouve l'anime, cherche sur Nyaa sous tous ses noms et range les releases VF, MULTi ou VOSTFR par film, pack de saison et épisode. Extension Chrome et Firefox, site privé à héberger soi-même.
User interface language: **French**, unless the owner says otherwise.
Started with Groundwork; the reasons behind each choice are recorded in `docs/decisions/`.

## Sources of truth

| Topic                                       | Where                                                    |
| ------------------------------------------- | -------------------------------------------------------- |
| Roadmap, current phase                      | `docs/ROADMAP.md` — follow phases in order, update it    |
| Product: brief, research, actors, journeys  | `docs/product/`                                          |
| Decisions and their reasons                 | `docs/decisions/` (`journal.md` + one file per decision) |
| Architecture: apps, containers, domains     | `docs/architecture.md`                                   |
| Human setup and commands                    | `README.md` (150 lines at most)                          |
| Environment variables                       | `.env.example` (every variable, example values only)     |
| Environment rules                           | `.agents/rules/environment.md`                           |
| Development workflow, tests, done           | `.agents/rules/workflow.md`                              |
| User-facing content                         | `.agents/rules/ui-content.md`                            |
| Brand: logo, colours, fonts                 | `.agents/rules/brand.md`                                 |
| Installed agent skills                      | `.claude/skills/` or `.agents/skills/`, `skills-lock.json` |

## Architecture

Bun workspaces: `apps/` holds what runs, `packages/` what is shared.

- `apps/web` — tanstack-start (web, port 3530, container)
- `packages/shared` — zod (shared)

Stack:

- runtime: bun
- web: tanstack-start
- auth: better-auth
- db: sqlite
- validation: zod
- ui: shadcn
- icons: tabler-icons
- extension: wxt
- deploy: docker-ghcr

A brick planned for a later phase of `docs/ROADMAP.md` is listed but not installed yet: check `package.json` before using it.

Rules:

- Keep UI, business logic, data access, validation and messaging separated; one owner per behaviour.
- Extend the module that already owns a behaviour; no speculative abstraction, no "for later" layer.
- Validation at the trust boundary (server, API) is authoritative; client validation mirrors it.
- TypeScript only, strict mode, no `any`. No new dependency when the platform or an installed
  package already solves the problem; prefer the framework's own tools over extra libraries.
- No business feature ahead of the roadmap phase, and nothing unrelated to the current task.
- Never commit real secrets; configuration comes from the environment, validated at startup.
- Code is read by humans and agents: clear names, small files with one responsibility,
  comments that explain why, not what.
- Each app in `apps/` builds into its own container image; databases and services stay internal.

## User-facing content (mandatory)

- Every text visible to users is written for users, never for developers: clear, natural,
  short, jargon-free, in **French** by default.
- Validation messages, errors, confirmations, toasts, notifications, labels, selects and
  filters all follow this rule.
- Never expose environment variable names, internal keys, technical field names, raw enums,
  payloads, identifiers, sensitive values or implementation details.
- An error states the problem and, when useful, the expected action.
- Backend values stay distinct from UI labels: map them (`ADMIN` → "Administrator"). Same for
  statuses, roles, categories, filters and constants.
- Light and dark themes are both required; screens work from 320 px wide without horizontal
  scroll and respect `prefers-reduced-motion`.
- Official brand files only, never a re-drawn logo (`.agents/rules/brand.md`).
- Check every new or changed text against `.agents/rules/ui-content.md`.

## Development workflow

Size the process to the request (details: `.agents/rules/workflow.md`):

- **Small change** (copy, style, small bug, a few files, no new data or route): do it, run
  `bun run check`, done. No spec, no plan, no subagents.
- **Feature**: a plan of ten lines at most in the chat, one approval, the code,
  `bun run check`, one `/ponytail-review` pass.
- **Large piece of work** (new module, data model, authentication, payments, security):
  a short spec and plan first.

Superpowers workflows (brainstorming, specs, plans, one subagent per task) are not used for
small changes or features in this repository. These project instructions take precedence.

Tests:

- Logic with a branch, a calculation, money or security leaves one small unit test.
- End-to-end tests cover only these critical journeys, and run only when a change touches one:

- Premier lancement : création du compte super admin
- Accepter une invitation puis se connecter
- Suspendre un membre depuis /admin
- Recherche directe et filtres sur le site
- Extension : recherche dans le panneau latéral
- Extension : recherche vide de nyaa.si rattrapée

Done = `bun run check` passes, changed UI was seen in a browser, and the report says what was
not verified. Two failures in a row on the same problem: stop and report instead of looping.

## Environment

- `.env.example` lists every variable with example values; `.env.local` (local) and `.env.prod`
  (production) hold real values and are never committed.
- Add each new variable to `.env.example` and to the startup validation, and to
  `.env.production.example` when it matters in production.
- Details and production rules: `.agents/rules/environment.md`.

## Commands

```bash
bun install          # dependencies (one bun.lock at the root)
bun run dev          # start the apps
bun run check        # format, lint, types, tests and project checks: run before handing off
bun run build        # production build
```

## Git and GitHub

- Never commit or push without explicit approval from the owner.
- Once the owner approves a commit: one commit per meaningful step, with a short message.
- `.agents/note_prompts.md` is a personal scratchpad, ignored by git. Do not rely on it.
- Keep the GitHub repository metadata current when the product or the stack changes: description,
  topics and homepage with `gh repo edit` (`--description`, `--add-topic`, `--remove-topic`).

## Skills

Project skills, installed with `bunx skills add` (lock: `skills-lock.json`):

- `tanstack-start-architecture` — Avant de toucher aux routes, fonctions serveur, middleware, à la route /api/auth/$ ou à la protection de /admin.
- `senior-frontend-engineering` — Pour une fonctionnalité ou un refactor du site ou de l'extension (état, appels AniList et Nyaa, composants, tests).
- `form-ux-validation` — Pour la recherche, les filtres, la connexion, l'invitation et les formulaires de /admin : validation, messages d'erreur, envoi.
- `responsive-interface-guardian` — Pour chaque écran nouveau ou modifié : tableau en cartes sur téléphone, panneau latéral étroit, débordements, zoom.
- `ux-ui-audit` — Pour auditer un écran existant (accessibilité, états vides, d'erreur, de chargement) avant de le refaire.
- `frontend-aesthetics` — Pour garder le site et l'extension fidèles à la direction de mood.md (sombre, Geist, jaune sous-titre).
- `chromatic-design` — Pour toute décision de couleur, de jeton ou de contraste, en thème sombre seulement.
- `ui-modern-2026` — Pour utiliser une capacité CSS récente avec son repli.
- `container-compose-ghcr-deployment` — Pour toute modification du Dockerfile, de Compose, du volume SQLite, de la CI ou de la publication d'image.
- `codebase-architecture-guardian` — Avant de décider où placer du code (parseur partagé, garde-fous de la recherche, rôles, extension) ou d'un refactor large.
- `shadcn` — Avant d'ajouter ou de modifier un composant shadcn/ui.

Use the narrowest skill that matches the task; these project rules take precedence over a skill.
