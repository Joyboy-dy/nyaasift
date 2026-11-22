# nyaasift — Plan de développement

Ce document est la référence de progression du projet. Chaque phase se termine par une
vérification (lint, types, build, parcours principaux) avant de passer à la suivante.
Une phase n'empiète pas sur la suivante.

Légende : ✅ terminé · 🚧 en cours · ⏳ à venir

---

## Phase 0 — Fondation technique ✅

- Monorepo Bun : `apps/web` (TanStack Start sous Bun, port 3530), `packages/shared` (Zod), posés par le setup Groundwork.
- `apps/extension` (WXT + React) créé juste après le setup avec `bunx wxt@latest init` : Groundwork ne connaît pas encore le type « extension ».
- shadcn/ui dans le web ; Tabler Icons (`@tabler/icons-react`, trait 1,5) à la place des icônes lucide posées par shadcn.
- `deploy/Dockerfile` (une image), `compose.yaml` avec un volume `data/` pour SQLite, CI et publication d'image GHCR.
- `bun run check` au vert (lint, types, build, tests) ; page de bienvenue sur http://localhost:3530 ; l'extension se construit pour Chrome et Firefox.

## Phase 1 — Authentification et /admin ✅

À partir de `actors.md`.

- **Base** : SQLite (`bun:sqlite`), fichier `data/nyaasift.sqlite` ; Better Auth (`bun add better-auth`) avec l'adaptateur intégré, tables créées par `bunx --bun auth@latest migrate` ; nos deux tables (invitations, liens de réinitialisation) en migrations SQL versionnées.
- **Montage** : route `src/routes/api/auth/$.ts` (GET et POST vers `auth.handler`), plugin `tanstackStartCookies` en dernier.
- **Méthode** : e-mail et mot de passe, aucun fournisseur social, 12 caractères au moins.
- **Inscription fermée** : `disableSignUp`. Exception : premier lancement, tant qu'aucun compte n'existe, seul `SUPER_ADMIN_EMAIL` peut créer son compte (page « Premier lancement »), puis la page disparaît.
- **Invitations** (super admin seulement) : lien à usage unique, 7 jours, e-mail facultatif ; jeton haché. Page « Accepter une invitation » : nom, e-mail, mot de passe → compte créé côté serveur → connecté. Lien expiré, déjà utilisé ou invalide : message clair.
- **Pas de vérification d'e-mail** (aucun envoi) : l'invitation tient lieu de preuve.
- **Mot de passe oublié** : un admin crée un lien de réinitialisation à usage unique (24 h) ; à l'usage, `setUserPassword` et sessions fermées. Super admin : `bun run admin:reset-link <email>`.
- **Rôles** (plugin `admin`, `createAccessControl`) :
  - membre (`user`) : chercher ;
  - admin : suspendre et réactiver un membre (`banUser` / `unbanUser`, sessions fermées), créer un lien de réinitialisation ;
  - super admin (déduit de `SUPER_ADMIN_EMAIL`, jamais stocké) : en plus inviter, retirer un compte, nommer et retirer des admins ;
  - un admin n'agit ni sur un autre admin ni sur le super admin.
- **`/admin`** : onglets Membres et Administrateurs (super admin seulement) ; chaque action passe par une fonction serveur validée par Zod qui revérifie le rôle.
- **Protection des espaces** : tout le site exige une session, sauf connexion, invitation et premier lancement ; redirection vers la connexion avec retour ; pages invitées inaccessibles une fois connecté ; « Réservé aux admins » pour un membre sur `/admin`.
- **Limites** : tentatives de connexion limitées (Better Auth) ; recherche limitée par compte (phase 2).
- Erreurs traduites en français, états de chargement.
- **Développement** : seed avec `SUPER_ADMIN_EMAIL` et comptes de test ; aucun e-mail à intercepter.
- **Tests E2E** : premier lancement, invitation acceptée, connexion, suspension d'un membre, `/admin` refusé à un membre.

## Phase 2 — Moteur de recherche Nyaa ✅

- **Parseur** dans `packages/shared`, porté de `docs/product/prototype/nyaa.py` : épisode, saison, plage, pack, film, résolution, langue (MULTi sans « Multi-Subs », VF, VFF, TRUEFRENCH, VOSTFR, SUBFRENCH), remake. Tests sur les vrais noms relevés le 2026-11-22 (Tsundere-Raws, VARYG, ToonsHub, T3KASHi, Judas).
- **Rangement** dans `packages/shared` : films, packs, épisodes, non classés ; meilleure release par épisode (seeders, remakes écartés), autres releases.
- **Client AniList** dans `packages/shared` : titres romaji et anglais, affiche, correspondances.
- **Fonction serveur** `search` (session exigée) : RSS puis HTML paginé (`HTMLRewriter`), cache 5 min, file globale, coupe-circuit, limite par compte ; `User-Agent` honnête.
- **Vérification depuis le serveur réel** : ddos-guard laisse-t-il passer son IP ? Débit toléré, mesuré prudemment.
- Tests : parseur, rangement, limite par compte, coupe-circuit (cache servi après un 429 simulé).

## Phase 3 — Site : recherche et résultats ✅

- Direction validée (`mood.md`) : sombre seulement, Geist et Geist Mono, jaune sous-titre #f2cf4a, codes `S02 · E11`, piste d'épisodes.
- Accueil, résultats (fiche de l'anime, filtres, Films, Packs, Épisodes, Non classés), recherche dans l'adresse.
- Autres releases dépliables, « Pas le bon anime ? », recherche brute, Nyaa ne répond pas, version téléphone.
- Tests E2E : recherche directe, filtrer, ouvrir une release, Nyaa indisponible.

## Phase 4 — Extension Chrome et Firefox 🚧

- Panneau latéral (entrée `sidepanel` de WXT : `side_panel` sur Chrome, `sidebar_action` sur Firefox), ouvert par l'icône.
- Service worker : requêtes vers nyaa.si (permission d'hôte) et AniList ; parseur et rangement de `packages/shared` ; petit cache local ; requêtes espacées.
- Barre sur les pages de recherche de nyaa.si (content script) : compte ce qui est déjà sur la page ; recherche vide rattrapée par AniList ; repli silencieux si la page de Nyaa change.
- Bouton « Chercher sur Nyaa » sur les fiches AniList et MyAnimeList (content scripts), qui ouvre le panneau sur l'anime exact.
- Réglages (stockage de l'extension) : langue, qualité, barre, rattrapage, bouton, toutes les releases.
- Tests : parseur de la page de Nyaa sur des pages enregistrées ; parcours du panneau en navigateur de test.

## Phase 5 — Installation locale, mise en ligne, publication 🚧

- README (français, puis anglais) : site privé en local (`.env` + `docker compose up -d`), installation de l'extension.
- `LICENSE` (MIT, si validée) ; mentions des projets dont du code MIT est repris.
- Déploiement du site privé sur le serveur du propriétaire (Dokploy), domaine choisi, proxy TLS, sauvegarde du volume SQLite.
- Extension : soumission au Chrome Web Store et à addons.mozilla.org ; en cas de refus, Firefox signé non listé et paquet Chrome dans les releases GitHub.
- Publication du dépôt GitHub public, seulement avec l'accord explicite du propriétaire.

## Plus tard (hors MVP)

- Mode restreint par adresses IP (optionnel), envoi d'e-mails, double authentification.
- Interface en anglais, autres langues de filtres, groupes favoris ou exclus, suivi d'un anime, SeaDex.

## Journal

### 2026-11-22

- Phases 0 à 3 faites d'une traite, à la demande du propriétaire (« toutes les phases en même temps »).
- `packages/shared` : parseur porté du prototype Python, rangement, filtres, AniList, flux RSS ; 22 tests sur de vrais noms de releases.
- Site : premier lancement, invitations à usage unique, liens de réinitialisation, rôles (droits du plugin admin restreints : un admin ne peut pas appeler `/api/auth/admin/*` au-delà de la suspension), `/admin` Membres et Administrateurs, recherche et résultats conformes aux maquettes.
- Vérifié dans le navigateur : premier lancement, invitation acceptée puis refusée à la 2ᵉ utilisation, `/admin` refusé à un membre (et API admin directe en 403), suspension qui bloque la connexion, inscription directe refusée (403), recherche « saga tanya » en voix FR (2 films, 2 packs, 12 épisodes).
- Recherche Nyaa : une seule requête combinée pour tous les titres (de ~30 s à 1–6 s).
- Quand AniList dit FILM, les releases sans numéro d'épisode vont dans Films.
- Production : build et démarrage vérifiés en local (SQLite créé, premier lancement, inscription directe refusée). Image Docker non construite : Docker était arrêté.
- Reste en phase 5 : déploiement réel (domaine, Dokploy), vérifier depuis le serveur que ddos-guard laisse passer son IP, publication de l'extension dans les catalogues.
