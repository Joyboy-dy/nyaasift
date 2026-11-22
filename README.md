# nyaasift

Tape le titre comme il te vient : nyaasift retrouve l'anime, cherche sur Nyaa sous tous ses noms et range les releases VF, MULTi ou VOSTFR par film, pack de saison et épisode.

- **Extension Chrome et Firefox** : un panneau latéral de recherche, une barre discrète sur nyaa.si, un bouton « Chercher sur Nyaa » sur AniList et MyAnimeList. Tout se passe dans ton navigateur, avec ton IP ; rien n'est envoyé ailleurs qu'à nyaa.si et AniList.
- **Site privé à héberger soi-même** : la même recherche pour toi et une dizaine d'amis, sur invitation, géré dans `/admin`.

« saga tanya » ne donne rien sur Nyaa ; nyaasift reconnaît *Youjo Senki* via AniList, cherche sous ses vrais titres, et range le résultat : films, packs de saison, épisodes dans l'ordre avec la meilleure release de chacun (les autres se déplient).

nyaasift ne télécharge rien et n'héberge aucun fichier : il donne les liens vers les pages de Nyaa et les liens magnet.

## Installer l'extension

En attendant sa publication dans les catalogues (procédure : [docs/store/chrome-web-store.md](docs/store/chrome-web-store.md)) :

```bash
bun install
bun run --cwd apps/extension build           # Chrome, Edge, Brave… → apps/extension/.output/chrome-mv3
bun run --cwd apps/extension build:firefox   # Firefox → apps/extension/.output/firefox-mv2
```

- **Chrome** : `chrome://extensions` → mode développeur → « Charger l'extension non empaquetée » → `apps/extension/.output/chrome-mv3`.
- **Firefox** : `about:debugging#/runtime/this-firefox` → « Charger un module temporaire » → `apps/extension/.output/firefox-mv2/manifest.json`.

## Héberger le site privé

### En local, en une commande (Docker)

```bash
cp .env.example .env    # remplir SUPER_ADMIN_EMAIL et BETTER_AUTH_SECRET (32 caractères au moins)
docker compose -f deploy/compose.local.yaml --env-file .env up -d --build
```

Ouvre http://localhost:3530 : la page « Premier lancement » crée le compte du super admin (l'e-mail de `SUPER_ADMIN_EMAIL`). Ensuite, on n'entre que sur invitation. Tes recherches Nyaa partent de ta propre IP.

### Sur un serveur

Tout ce qui concerne la production est dans `deploy/` ; le pas-à-pas Dokploy est dans [deploy/DEPLOY.md](deploy/DEPLOY.md). Le compose construit l'image depuis les sources : aucun registre à configurer.

```bash
cp deploy/.env.production.example deploy/.env.prod   # trois valeurs à remplir, sur le serveur seulement
docker compose -f deploy/compose.yaml --env-file deploy/.env.prod up -d --build
```

- Aucun port n'est publié : le proxy TLS (Traefik de Dokploy, Caddy…) joint le conteneur `web` sur le port 3000 par le réseau Docker. Il doit transmettre l'IP du visiteur dans `X-Forwarded-For` (ou régler `TRUSTED_IP_HEADER`).
- La base SQLite est dans le volume `data` : c'est le seul élément à sauvegarder.
- Les requêtes vers Nyaa du site partent de l'IP du serveur. Pour ne jamais se faire bloquer : une seule requête à la fois, cache de 5 minutes, pause automatique après un refus (les derniers résultats connus restent servis), limite de 20 recherches par minute et par compte.

## Administration

| Rôle | Qui | Peut |
| --- | --- | --- |
| Super admin | l'e-mail de `SUPER_ADMIN_EMAIL` (un seul) | tout : inviter, retirer un compte, nommer et retirer des admins |
| Admin | un membre nommé par le super admin | suspendre et réactiver un membre, créer un lien de mot de passe |
| Membre | une personne invitée | chercher |

- **Inviter** : `/admin` → Membres → « Créer un lien d'invitation » (e-mail facultatif). Le lien sert une fois et vaut 7 jours ; envoie-le toi-même.
- **Mot de passe oublié** : un admin crée un « Lien mot de passe » (une fois, 24 h). Le super admin qui a perdu le sien le crée sur le serveur :

```bash
docker compose -f deploy/compose.yaml --env-file deploy/.env.prod exec web bun dist/reset-link.js toi@exemple.fr
bun run admin:reset-link toi@exemple.fr   # en développement
```

- Aucun e-mail n'est envoyé par nyaasift, aucune statistique, aucun historique de recherche.

## Développer

Prérequis : [Bun](https://bun.sh) 1.3 ou plus, git ; Docker pour les images.

```bash
bun install
cp .env.example .env.local   # remplir les valeurs locales
bun run dev                  # site sur http://localhost:3530
bun run --cwd apps/extension dev:chrome   # ou dev:firefox : navigateur de test avec l'extension
bun run check                # formatage, lint, types, tests, contrôles du projet
```

| Dossier | Rôle |
| --- | --- |
| `apps/web` | Site privé (TanStack Start sous Bun, SQLite, Better Auth) |
| `apps/extension` | Extension Chrome et Firefox (WXT, React) |
| `packages/shared` | Lecture des noms de releases, rangement, filtres, AniList, Nyaa : partagé par le site et l'extension |

Documentation : produit dans `docs/product/`, décisions dans `docs/decisions/`, architecture dans `docs/architecture.md`, feuille de route dans `docs/ROADMAP.md`, règles pour les agents dans `AGENTS.md`.

## Licence

MIT, voir [LICENSE](LICENSE). nyaasift n'est affilié ni à Nyaa ni à AniList.
