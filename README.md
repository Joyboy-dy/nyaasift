# nyaasift

Tape le titre comme il te vient : nyaasift retrouve l'anime, cherche sur Nyaa sous tous ses noms et range les releases VF, MULTi ou VOSTFR par film, pack de saison et épisode. Extension Chrome et Firefox, site privé à héberger soi-même.

## Prérequis

- [Bun](https://bun.sh) 1.3 ou plus
- Docker, pour les services locaux et les images de production
- git

## Installation

```bash
bun install
cp .env.example .env.local   # puis remplir les vraies valeurs locales
```

## Commandes

| Commande          | Rôle                                                  |
| ----------------- | ----------------------------------------------------- |
| `bun run dev`     | Lance les apps en développement                       |
| `bun run check`   | Formatage, lint, types, tests et contrôles du projet  |
| `bun run build`   | Build de production                                   |

## Structure

- `apps/web` — tanstack-start (web, port 3530, container)
- `packages/shared` — zod (shared)

## Documentation

- Produit : `docs/product/`
- Feuille de route : `docs/ROADMAP.md`
- Décisions : `docs/decisions/`
- Règles pour les agents : `AGENTS.md`
