# nyaasift · acteurs (revu le 2026-11-22)

## Rôles

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| Utilisateur de l'extension | Toute personne qui installe l'extension, sans compte | Chercher depuis le panneau latéral, la barre ajoutée sur nyaa.si ou le bouton AniList/MAL ; régler ses préférences |
| Membre | Personne invitée sur le site privé | Se connecter, chercher, filtrer, ouvrir les releases |
| Admin | Membre nommé admin par le super admin | Tout ce que fait un membre, plus, dans `/admin` : suspendre ou réactiver un membre, fermer ses sessions, créer un lien de réinitialisation de mot de passe |
| Super admin | L'e-mail de la variable d'environnement `SUPER_ADMIN_EMAIL` (un seul) | Tout ce que fait un admin, plus inviter (liens à usage unique), nommer et retirer des admins, retirer un membre |
| Utilisateur local | Quelqu'un qui installe nyaasift chez lui | Il est le super admin de son installation (sa propre variable `SUPER_ADMIN_EMAIL`) |

> Dans la variable d'environnement admin, on va ajouter un seul email qui est le super admin. Dans l'interface admin, on pourra ajouter d'autres emails qui seront admin, mais pas super admin : seul le super admin aura l'autorisation d'inviter de nouvelles personnes. Les autres admins vont aider à gérer la plateforme. (propriétaire, 2026-11-22)

## Espaces

- **Extension** : panneau latéral (ouvert par l'icône), barre ajoutée sous la recherche de nyaa.si, bouton sur les fiches AniList et MyAnimeList, page de réglages. Aucun compte, rien envoyé à nos serveurs.
- **Site privé** (app web) : connexion, invitation, recherche.
- **`/admin`** : espace protégé du site (pas d'app séparée), visible seulement des admins et du super admin. Pages : Membres, Administrateurs (super admin seulement).

## Connexion

- Extension : aucune.
- Site privé : e-mail et mot de passe, **uniquement sur invitation**. Pas d'inscription libre.
- **Premier lancement** : seul l'e-mail `SUPER_ADMIN_EMAIL` peut créer son compte sans invitation.
- **Invitation** : lien créé par le super admin, à usage unique, valable 7 jours (proposé), lié à un e-mail si le super admin le précise. Il l'envoie lui-même.
- **Mot de passe oublié** : pas d'envoi d'e-mails ; un admin crée un lien de réinitialisation à usage unique et l'envoie lui-même. Le super admin dispose d'une commande serveur pour le sien.

## Organisations

Non : un seul cercle.

## Matrice rôle × droits

| Action | Membre | Admin | Super admin |
|---|---|---|---|
| Chercher, filtrer, ouvrir une release | oui | oui | oui |
| Ouvrir `/admin` | non | oui | oui |
| Suspendre, réactiver un membre, fermer ses sessions | non | oui (pas un admin ni le super admin) | oui |
| Créer un lien de réinitialisation de mot de passe | non | oui (membres) | oui |
| Inviter (lien à usage unique) | non | non | oui |
| Retirer définitivement un membre | non | non | oui |
| Nommer ou retirer un admin | non | non | oui |
| Changer le super admin | non | non | non (variable d'environnement seulement) |
