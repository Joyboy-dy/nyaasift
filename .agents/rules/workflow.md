# Development workflow

The owner is busy: a small change must not take a day. Size the process to the request.

## Three sizes of request

| Size | Typical request | Process |
| --- | --- | --- |
| **Small change** | Copy, style, a small bug, a few files, no new data or route | Do it, `bun run check`, report. No spec, no plan, no subagents. |
| **Feature** | A new screen, endpoint or behaviour on existing data | A plan of ten lines at most in the chat, one approval, the code, `bun run check`, one `/ponytail-review` pass. |
| **Large piece of work** | New module, data model, authentication, payments, security, migration | A short spec and plan first, approved, then the work. |

When unsure between two sizes, pick the smaller one and say so.

Superpowers workflows (brainstorming, specs, plans, one subagent per task) are not used for small
changes or features in this repository. Use them only for a large piece of work, when the owner
asks. These project instructions take precedence.

## Tests

- Logic with a branch, a loop, a parser, a calculation, money or security leaves one small
  unit test.
- No test for code that only arranges markup or calls one library function.
- End-to-end tests (Playwright) cover only these critical journeys:

- Premier lancement : création du compte super admin
- Accepter une invitation puis se connecter
- Suspendre un membre depuis /admin
- Recherche directe et filtres sur le site
- Extension : recherche dans le panneau latéral
- Extension : recherche vide de nyaa.si rattrapée

  They run only when a change touches one of them. Everything else is covered by
  `bun run check` and the owner's manual check.

## Done

- `bun run check` passes.
- Changed UI was seen in a browser, in light and dark themes.
- The report says, in a few lines, what changed, what was checked and what was not.

## Loops

Two failures in a row on the same problem: stop, report what fails, what was tried and what is
proposed. Do not keep retrying the same fix.

## Repository metadata

When the product or the stack changes, update the GitHub description and topics in the same
change (`gh repo edit --description … --add-topic … --remove-topic …`).
