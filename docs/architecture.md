# nyaasift · architecture

## 1. Apps

| Nom | Rôle | Framework | Port local | Conteneur | Domaine |
|---|---|---|---|---|---|
| `web` | Site privé complet : pages, recherche Nyaa (fonction serveur), authentification (`/api/auth/$`), `/admin` | TanStack Start sous Bun | 3530 | oui | à choisir |
| `extension` | Panneau latéral, barre sur nyaa.si, bouton AniList/MAL, réglages | WXT + React | serveur de dev WXT | non (paquets `.zip` Chrome et Firefox) | — |

## 2. Paquets

- `packages/shared` : le **parseur de noms de releases** (épisode, saison, plage, pack, film, résolution, langue VF / MULTi / VOSTFR, remake), porté de `docs/product/prototype/nyaa.py` avec ses tests ; le **rangement** (films, packs, épisodes, non classés, meilleure release par épisode) ; le **client AniList** ; les schémas Zod communs. Utilisé par le site et l'extension.

## 3. Services

Aucun. La base est un fichier SQLite (`bun:sqlite`) dans un volume : `data/nyaasift.sqlite`.

## 4. Domaines

- Un seul domaine public (**à choisir**), servi par `web`. Tout est sur la même origine (`/api/auth/$` compris) : pas de CORS.

## 5. Flux

```
SITE PRIVÉ (un seul processus Bun)
Navigateur ──► AniList GraphQL (IP du membre, 30 req/min)          ── titres, affiche
     └──► web (TanStack Start)
            ├─ /api/auth/$          Better Auth → SQLite (sessions par cookie)
            ├─ fonction serveur search (session exigée)
            │    ├─ limite par compte (seau de jetons en mémoire)
            │    ├─ cache mémoire 5 min (clé = requête Nyaa)
            │    ├─ une seule requête pour tous les titres : ("titre 1"|"titre 2") [+ (multi|vf|…) si filtre FR]
            │    ├─ file globale vers Nyaa (une requête à la fois, 1 s d'écart au moins)
            │    ├─ coupe-circuit après 429 ou défi ddos-guard → cache servi
            │    └─► nyaa.si : RSS (page 1), puis jusqu'à 3 pages HTML si ≥ 75 résultats
            └─ /admin + fonctions serveur d'administration (rôle admin ou super admin)

EXTENSION (aucun appel à nos serveurs)
Panneau / barre / bouton ──► AniList GraphQL (IP de l'utilisateur)
                         └─► nyaa.si via le service worker (permission d'hôte, IP de l'utilisateur)
                              → parseur et rangement de packages/shared → affichage
```

- **Rôles** : `superadmin` = `SUPER_ADMIN_EMAIL`, calculé à chaque requête ; `admin` et `user` stockés par le plugin `admin` de Better Auth.
- **Premier lancement** : tant qu'aucun compte n'existe, seule l'inscription de `SUPER_ADMIN_EMAIL` est acceptée ; ensuite `disableSignUp`, et un compte ne naît que d'une invitation valide.
- **Invitation** : jeton aléatoire stocké haché, usage unique, 7 jours, e-mail facultatif ; le serveur crée le compte quand le jeton est valide.
- **Lien de réinitialisation** : créé par un admin, même principe ; à l'usage, `setUserPassword` et sessions fermées.
- **Super admin qui a perdu son mot de passe** : `bun run admin:reset-link <email>` sur le serveur.
- **Aucun pistage** : pas d'historique de recherche, IP non journalisées.

## 6. Développement local

- `bun install`
- `bun run dev` : site sur http://localhost:3530 (le fichier SQLite est créé au premier lancement)
- Extension : `bun run --cwd apps/extension dev:chrome` ou `dev:firefox`, navigateur de test ouvert par WXT
- Installation locale pour un utilisateur : `.env` avec `SUPER_ADMIN_EMAIL`, puis `docker compose up -d`, puis http://localhost:3530
