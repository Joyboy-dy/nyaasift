# Déployer nyaasift avec Dokploy

| Fichier | Rôle | Commité |
| --- | --- | --- |
| `compose.yaml` | Déploiement serveur : construit l'image depuis le dépôt, aucun registre | oui |
| `Dockerfile` | Image du site (Bun, SQLite) | oui |
| `compose.local.yaml` | Installation locale en une commande | oui |
| `.env.production.example` | Les variables à fournir, valeurs d'exemple | oui |
| `.env.prod` | Tes vraies valeurs (secret déjà généré) | **non**, jamais |

## Mise en place (service Compose)

1. **Provider** : *GitHub* (ou *Git* avec `https://github.com/Joyboy-dy/nyaasift.git`, le dépôt est public), branche `main`, **Compose Path** : `./deploy/compose.yaml`. Activer *Autodeploy* si tu veux un déploiement à chaque push.
2. **Environment** : colle les trois lignes de `deploy/.env.prod` (`APP_URL`, `BETTER_AUTH_SECRET`, `SUPER_ADMIN_EMAIL`). Tout le reste est déjà réglé par le compose et l'image.
3. **Domains** : *Add Domain* → service `web`, host `nyaasift.obaxel.com` (le même que `APP_URL`), **container port 3000**, HTTPS activé, certificat Let's Encrypt. Le DNS du domaine doit pointer vers le serveur.
4. **Deploy**. La première construction prend quelques minutes.
5. Ouvre `https://nyaasift.obaxel.com` : la page « Premier lancement » crée le compte du super admin, avec l'e-mail de `SUPER_ADMIN_EMAIL`.

La base SQLite vit dans le volume `data` du compose : elle survit aux redéploiements. Le contrôle de santé de l'image appelle `/connexion`.

## Après la mise en ligne

1. **Nyaa répond-il depuis le serveur ?** Connecte-toi et cherche « frieren ». Un message « Nyaa ne répond pas » dès la première recherche veut dire que ddos-guard filtre l'IP du serveur. L'extension, elle, n'est pas concernée.
2. **Sauvegardes** : onglet *Volume Backups*, volume `data`, vers une destination S3.
3. **Mot de passe du super admin perdu** : onglet *Containers* → terminal du conteneur `web` → `bun dist/reset-link.js ton@email`.
4. **Extension publiée** : ajoute `CHROME_EXTENSION_URL=<adresse de la fiche>` dans *Environment* et redéploie.

## Variables

| Variable | Rôle |
| --- | --- |
| `APP_URL` | Adresse publique en https, sans `/` final |
| `BETTER_AUTH_SECRET` | Secret des sessions ; ne plus le changer une fois en ligne (tout le monde serait déconnecté) |
| `SUPER_ADMIN_EMAIL` | Seul compte créable sans invitation, super admin |
| `CHROME_EXTENSION_URL` | Facultatif : fiche du Chrome Web Store ; vide = lien vers les instructions GitHub |
