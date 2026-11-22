# Déployer nyaasift avec Dokploy

Tout ce qui concerne la production est dans ce dossier :

| Fichier | Rôle | Commité |
| --- | --- | --- |
| `Dockerfile` | Image du site (Bun, SQLite) | oui |
| `compose.yaml` | Déploiement à partir des images publiées sur GHCR | oui |
| `compose.local.yaml` | Installation locale en une commande | oui |
| `.env.production.example` | Liste des variables, valeurs d'exemple | oui |
| `.env.prod` | **Vraies valeurs** (secret déjà généré) | **non**, jamais |

## Méthode conseillée : Dokploy construit l'image depuis le dépôt

1. **Projet** : Dokploy → *Create Project* → `nyaasift`.
2. **Application** : *Create Service* → *Application*.
3. **Source** : *GitHub* → dépôt `Joyboy-dy/nyaasift`, branche `main`.
   (Le dépôt est privé : installe l'application GitHub de Dokploy sur ce dépôt quand Dokploy le demande.)
4. **Build** :
   - Build Type : **Dockerfile**
   - Docker File : `deploy/Dockerfile`
   - Docker Context Path : `.` (la racine du dépôt)
   - Docker Build Stage : `web`
5. **Environment** : colle tout le contenu de `deploy/.env.prod`, après avoir rempli les deux lignes `À_REMPLIR` (ton domaine et ton e-mail de super admin). Le bloc « Seulement pour deploy/compose.yaml » peut rester, il est ignoré ici.
6. **Volume** (onglet *Advanced* → *Volumes / Mounts*) : un volume nommé, par ex. `nyaasift-data`, monté sur **`/app/data`**. C'est là que vit la base SQLite : sans ce volume, les comptes disparaissent à chaque déploiement.
7. **Domaine** (onglet *Domains*) : ton domaine, **port du conteneur 3000**, HTTPS activé (Let's Encrypt). Le domaine doit être exactement celui de `APP_URL`.
8. **Deploy**. Puis ouvre `https://ton-domaine` : la page « Premier lancement » crée le compte du super admin (l'e-mail de `SUPER_ADMIN_EMAIL`).

Le contrôle de santé de l'image (`HEALTHCHECK`) appelle `/connexion` ; Dokploy affiche l'application en bonne santé quand il répond.

### Mises à jour

Chaque push sur `main` peut redéployer automatiquement (*Auto Deploy* dans Dokploy). Le volume `/app/data` est conservé ; les tables manquantes sont créées au démarrage.

## Autre méthode : images publiées sur GHCR (`compose.yaml`)

Le workflow `.github/workflows/release.yml` publie `ghcr.io/joyboy-dy/nyaasift-web` à chaque push sur `main` (tag `main`) et à chaque tag `v1.2.3`. Dans Dokploy : *Create Service* → *Compose* → fichier `deploy/compose.yaml`, variables de `deploy/.env.prod` (avec `IMAGE_PREFIX` et `VERSION`). Le dépôt étant privé, le serveur doit pouvoir lire GHCR (jeton avec `read:packages`) ; la méthode Dockerfile ci-dessus l'évite.

## Après la mise en ligne

1. **Vérifier que Nyaa répond depuis le serveur** : connecte-toi, cherche « frieren ». Si un message « Nyaa ne répond pas » apparaît dès la première recherche, ddos-guard filtre l'IP du serveur (fréquent chez certains hébergeurs) : l'extension, elle, n'est pas concernée.
2. **Sauvegarder** le volume `nyaasift-data` (sauvegarde de volume de Dokploy, ou copie de `/app/data/nyaasift.sqlite`).
3. **Mot de passe du super admin perdu** : dans le terminal du conteneur (Dokploy → *Docker Terminal*) : `bun dist/reset-link.js ton@email`.

## Variables

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `APP_URL` | oui | Adresse publique en https, sans `/` final |
| `BETTER_AUTH_URL` | oui | Même valeur que `APP_URL` |
| `BETTER_AUTH_SECRET` | oui | Secret des sessions (généré dans `.env.prod`, ne pas le changer ensuite) |
| `SUPER_ADMIN_EMAIL` | oui | Seul compte créable sans invitation, super admin |
| `DATABASE_PATH` | non | `/app/data/nyaasift.sqlite` par défaut dans l'image |
| `TRUSTED_IP_HEADER` | non | `x-forwarded-for` (posé par Traefik dans Dokploy) |
| `CHROME_EXTENSION_URL` | non | Fiche du Chrome Web Store ; vide = lien vers les instructions GitHub |
| `PORT` | non | 3000 |
