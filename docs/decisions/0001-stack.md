# 0001 · Stack

Date : 2026-11-22 · Statut : proposée (validée à l'arrêt 3) · Révisée le même jour sur les remarques du propriétaire (« adapter la stack au produit, pas toujours la même stack »).

## Contexte

nyaasift range les releases de Nyaa : il retrouve l'anime sous tous ses noms (AniList), filtre par langue (VF, MULTi, VOSTFR), qualité, saison et type, et sépare films, packs et épisodes. Deux faces : une **extension Chrome et Firefox** publique (panneau latéral, barre ajoutée sur nyaa.si, bouton sur AniList et MyAnimeList) et un **site privé** hébergé (5 à 10 personnes, sur invitation, géré dans `/admin`). Open source, installable en local.

Ce que le produit demande à un serveur, pour le site privé seulement (l'extension n'appelle jamais nos serveurs) : lire Nyaa à la place du navigateur (Nyaa refuse les autres sites) avec cache, file et limite par compte ; gérer une dizaine de comptes ; servir les pages. Ni API séparée, ni serveur de base de données.

Besoins cochés (grille), avec la phrase du dossier produit qui les montre :

- **Type d'app : web + extension navigateur.** « L'extension (Chrome et Firefox) est le produit public, développée en même temps que le site » (`brief.md`).
- **Comptes et rôles.** « Site privé : e-mail et mot de passe, uniquement sur invitation » ; rôles membre, admin, super admin (`actors.md`).
- **Administration**, dans le site. « `/admin` : espace protégé du site (pas d'app séparée) » (`actors.md`).
- **Volume attendu : très faible.** « Site privé : 5 à 10 personnes » (`features.md`).
- **Protection du serveur face à Nyaa.** « Nyaa ne doit jamais bloquer le serveur » (`brief.md`).

Non cochés : e-mails, organisations, fichiers, paiements, temps réel, SEO, graphiques, avatars, API publique.

Faits vérifiés le 2026-11-22 :

- **AniList** : `Access-Control-Allow-Origin: *`, 30 requêtes par minute et par IP : appelé depuis le navigateur (site et extension).
- **Nyaa** : aucun en-tête CORS, derrière `ddos-guard` ; 75 résultats par page ; RSS limité à la première page ; pagination HTML valide au-delà de la page 100.
- **TanStack Start** : fonctions serveur (`createServerFn`) et routes serveur (`server.handlers`) dans l'app elle-même ; hébergement sous Bun (preset Nitro `bun`, React 19).
- **Better Auth** : accepte directement `bun:sqlite` (adaptateur Kysely intégré) ; `bunx --bun auth@latest migrate` crée les tables, plugin `admin` compris ; se monte sur une route `/api/auth/$` de TanStack Start, plugin `tanstackStartCookies` en dernier. Better Auth dépend déjà de Zod.
- **TanStack Router** : pas de bibliothèque de schémas propre ; `validateSearch` accepte une fonction ou un schéma Standard Schema ; Zod 4 sans adaptateur.

## Décision

| Brique | Choix | Raison liée au produit | Alternatives écartées | Fiche |
|---|---|---|---|---|
| Runtime | Bun (1.4.x) | Fait tourner le site ; SQLite intégré (`bun:sqlite`) ; `HTMLRewriter` pour lire les pages de Nyaa ; `bun test` pour le parseur | Node : il faudrait un pilote SQLite et un parseur HTML en plus | `catalog/bun.md` |
| Site (seul serveur) | TanStack Start | Pages, recherche Nyaa en fonction serveur, authentification en route serveur, `/admin` protégé, filtres dans l'adresse validés | Next.js : rien ne l'impose ; SPA + API séparée : deux morceaux pour rien | `catalog/tanstack-start.md` |
| Extension | WXT (0.21.x) + React | Un seul code Chrome (`side_panel`) et Firefox (`sidebar_action`) ; content scripts pour la barre nyaa.si et le bouton AniList/MAL ; React comme le site, composants partagés ; MIT, actif | Plasmo : pas de version depuis mai 2025, panneau latéral non documenté | aucune fiche (écart) |
| Authentification | Better Auth (1.7.x) + plugin `admin` | Hachage, sessions, limite de tentatives, rôles (`createAccessControl`), suspension (`banUser` ferme les sessions), `setUserPassword` ; inscription libre coupée (`disableSignUp`) | Auth maison : code de sécurité à ne pas réécrire, même pour 10 personnes | `catalog/better-auth.md` |
| Données | **SQLite** (`bun:sqlite`), un fichier | Comptes, sessions, invitations, liens de réinitialisation ; une seule instance, 10 personnes ; sauvegarde = copier un fichier | PostgreSQL + Prisma (stack par défaut) : un conteneur, un ORM et des épinglages de version sans besoin ; Prisma n'apporte rien aux deux tables à nous | aucune fiche (écart) |
| Validation | Zod 4 | Déjà installé par Better Auth ; entrées des fonctions serveur (frontière de sécurité), filtres dans l'adresse, réglages de l'extension | Fonctions écrites à la main : plus de risques aux frontières ; Valibot : une dépendance de plus | `catalog/zod.md` |
| Interface | shadcn/ui | Composants possédés, réécrits à la direction validée (sombre, Geist, jaune sous-titre), partagés avec l'extension | — | `catalog/shadcn.md` |
| Icônes | **Tabler Icons** (3.52, MIT) | 6 545 icônes, épaisseur de trait réglable (1,5 comme les maquettes), aimant, lien externe, réglages, bouclier présents | Hugeicons gratuit : un seul style ; Lucide : écarté par le propriétaire ; Phosphor : moins d'icônes, épaisseur par paliers | aucune fiche (écart) |
| Déploiement | Docker, GHCR, Dokploy | Une seule image ; volume pour le fichier SQLite ; le même Compose sert à l'installation locale | Hébergement géré : le propriétaire héberge lui-même | `catalog/docker-ghcr.md` |
| Licence | MIT (proposée) | Open source ; compatible avec le code MIT réutilisable (nyaax, NyaaPy, nyaascraper) | GPL : rien ne l'impose | — |

Retirés par rapport à la stack par défaut : Elysia (API séparée), PostgreSQL, Prisma, React Email, Resend, Mailpit, Hugeicons.

## Conséquences

- **Un seul processus serveur** : moins de déploiement, pas de relais `/api`, pas de CORS.
- **Un seul parseur** (`packages/shared`) pour le site et l'extension, testé une fois.
- **L'extension ne touche pas nos serveurs** : aucune charge ni donnée chez nous.
- **Rôles** : `superadmin` déduit de `SUPER_ADMIN_EMAIL` à chaque requête, jamais stocké ; `admin` et `user` stockés par Better Auth.
- **Invitations et réinitialisations** : deux tables à nous dans le même fichier SQLite (jeton haché, usage unique, expiration), migrations SQL versionnées dans le dépôt.
- **Cache Nyaa et limites** en mémoire du processus : suffisant pour une instance.
- **SQLite** : une seule instance d'écriture ; si le site devait tourner sur plusieurs machines, revoir (PostgreSQL). Sauvegarder le volume.
- **Magasins d'extensions (risque)** : le Chrome Web Store interdit de « faciliter » le téléchargement non autorisé de contenus protégés ; des extensions comparables y sont publiées (AniList Releases, Nyaa Linker). Plan B : Firefox signé non listé et paquet Chrome dans les releases GitHub.
- **Barre sur nyaa.si** : dépend du HTML de Nyaa ; tests sur pages enregistrées, repli silencieux.
- **Écarts avec la méthode et la documentation** : WXT, SQLite et Tabler n'ont pas de fiche au catalogue ; Groundwork ne connaît ni le type « extension » ni une base SQLite : l'extension est créée après le setup avec `bunx wxt@latest init`, la base en phase 1 ; Bun est en 1.4.5 (la fiche dit 1.3) ; les CLI de Better Auth se lancent avec `bunx --bun` (sinon erreurs de types sur `bun:sqlite`) ; la doc Better Auth écrit `.inputValidator(…)` pour les fonctions serveur, celle de TanStack `.validator(…)` : suivre la version installée.
- **À revoir** : envoi d'e-mails si le cercle grandit ; mode restreint par IP ; PostgreSQL si plusieurs instances.
