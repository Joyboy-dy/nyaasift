# nyaasift · parcours (revu le 2026-11-22)

Les parcours marqués *(critique)* serviront aux tests de bout en bout (phase stack).

## Utilisateur de l'extension

1. **Panneau de recherche** *(critique)* : n'importe quel onglet → icône nyaasift → panneau latéral → titre approximatif → anime reconnu (AniList) → résultats rangés (packs, épisodes, films) → ouvrir une release.
2. **Barre sur nyaa.si** *(critique)* : nyaa.si → recherche Nyaa habituelle → la page de Nyaa reste telle quelle, une barre nyaasift apparaît sous la recherche (« 13 releases en voix FR · ranger dans le panneau ») → panneau ouvert sur la même recherche, rangée.
3. **Recherche vide rattrapée** *(critique)* : nyaa.si → « saga tanya » → Nyaa ne trouve rien → la barre dit « AniList reconnaît Youjo Senki · 13 releases en voix FR » → panneau ouvert sur ces résultats.
4. **Depuis AniList ou MyAnimeList** : fiche d'un anime → « Chercher sur Nyaa » → panneau ouvert sur cet anime exact.
5. **Réglages** : langue et qualité par défaut, barre sur nyaa.si, rattrapage des recherches vides, bouton AniList/MAL, toutes les releases.

## Membre (site privé)

6. **Accepter une invitation** *(critique)* : lien reçu → nom, e-mail, mot de passe → connecté sur l'accueil.
7. **Se connecter** *(critique)* : e-mail et mot de passe → page demandée.
8. **Chercher** *(critique)* : maquettes validées (recherche directe, filtres, autres releases, pas le bon anime, Nyaa ne répond pas).
9. **Mot de passe oublié** : demande à un admin → lien de réinitialisation à usage unique → nouveau mot de passe.

## Super admin

10. **Premier lancement** *(critique)* : site neuf → page de création de compte réservée à `SUPER_ADMIN_EMAIL` → `/admin`.
11. **Inviter** *(critique)* : `/admin` → Membres → « Inviter » (e-mail facultatif) → lien copié → envoyé par ses propres moyens.
12. **Nommer un admin** : `/admin` → Administrateurs → choisir un membre → admin.
13. **Retirer un membre** : `/admin` → Membres → retirer → compte supprimé, sessions fermées.

## Admin

14. **Suspendre un membre** *(critique)* : `/admin` → Membres → suspendre → ses sessions sont fermées, il ne peut plus se connecter ; réactiver plus tard.
15. **Réinitialiser un mot de passe** : `/admin` → Membres → « Lien de réinitialisation » → copié → envoyé.
16. **Accès refusé** : un membre ou un visiteur ouvre `/admin` → refusé (connexion demandée, ou « réservé aux admins »).

## Utilisateur local

17. **Installer** : README → `SUPER_ADMIN_EMAIL` dans `.env` → `docker compose up -d` → premier lancement → site sur `localhost`.
