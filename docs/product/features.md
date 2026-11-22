# nyaasift · fonctionnalités

## MVP

| Fonctionnalité | Espace | Source de l'idée |
|---|---|---|
| Recherche par titre approximatif, titres alternatifs via AniList | public | propriétaire (prototype) |
| Anime reconnu affiché, avec choix d'une autre correspondance | public | proposé ; concurrent : AniList Releases |
| Filtres langue VF / MULTi / VOSTFR | public | propriétaire |
| Filtres qualité, saison, type (film / série), seeders minimum | public | propriétaire |
| Résultats rangés : Films, Packs de saison, Épisodes dans l'ordre | public | propriétaire |
| Meilleure release par épisode, « autres releases » dépliables | public | prototype ; proposé |
| Colonnes : épisode ou titre, nom, taille, seeders, langue, qualité, lien Nyaa | public | propriétaire |
| Lien magnet en plus du lien vers la page Nyaa | public | proposé (le flux Nyaa donne l'infoHash) |
| Plus de 75 résultats : pages suivantes de Nyaa quand le résultat est coupé | public | recherche (limite RSS confirmée) ; open source : Jackett, nyaax |
| Protection anti-blocage : cache partagé, file de requêtes vers Nyaa, pause après 429, limite par visiteur | public | propriétaire ; open source : Jackett |
| Recherche et filtres dans l'adresse de la page (partageable) | public | proposé |
| Installation locale en une commande | public | propriétaire |
| Interface en français, repères visuels de Nyaa repris | public | propriétaire |
| **Extension Chrome et Firefox** : panneau latéral de recherche, ouvert par l'icône | extension | propriétaire (2026-11-22) |
| Extension : barre ajoutée sous la recherche de nyaa.si (page de Nyaa inchangée), qui ouvre le panneau sur la même recherche | extension | propriétaire ; proposé |
| Extension : recherche vide de Nyaa rattrapée par les titres AniList, annoncée dans la barre | extension | propriétaire ; proposé |
| Extension : bouton « Chercher sur Nyaa » sur les fiches AniList et MyAnimeList | extension | propriétaire ; open source : Nyaa Linker (GPL, inspiration) |
| Extension : réglages (langue, qualité, barre, rattrapage, bouton) | extension | proposé |
| **Site privé** : comptes sur invitation seulement, connexion e-mail et mot de passe | app | propriétaire (2026-11-22) |
| Super admin désigné par `SUPER_ADMIN_EMAIL`, seul à pouvoir créer son compte au premier lancement | app | propriétaire |
| `/admin` · Membres : inviter par lien à usage unique (super admin), suspendre, réactiver, fermer les sessions, lien de réinitialisation (admins) | admin | propriétaire |
| `/admin` · Administrateurs : nommer et retirer des admins (super admin) | admin | propriétaire |
| Mot de passe oublié par lien de réinitialisation créé par un admin ; commande serveur pour le super admin | admin | proposé (pas d'envoi d'e-mails) |

Note : avec le site devenu privé (5 à 10 personnes), la limite « par visiteur » devient une limite par compte ; les garde-fous vers Nyaa restent.

## Plus tard

- Interface en anglais (après la version française).
- Filtres pour d'autres langues que le français.
- Recherche par fiche AniList (coller un lien AniList) sur le site.
- **Mode restreint par adresses IP** (liste d'IP ou de plages autorisées, gérée par les admins), désactivé par défaut : utile seulement si le cercle s'agrandit ; les IP des particuliers changent souvent.
- Envoi d'e-mails (invitations, mot de passe oublié) si le cercle grandit.
- Double authentification.
- Groupes favoris (Tsundere-Raws…) et groupes exclus.
- Suivi d'un anime : prévenir quand un nouvel épisode VF sort (flux RSS personnel).
- Mise en avant des recommandations SeaDex.

## Jamais

- Refaire entièrement l'interface de nyaa.si dans l'extension : trop fragile face aux changements de Nyaa (décision du 2026-11-22).
- Télécharger ou héberger des torrents : nyaasift donne seulement les liens.
- Pister les utilisateurs : aucune statistique d'usage, aucun historique de recherche gardé, aucune donnée envoyée ailleurs qu'à Nyaa et AniList. Les comptes n'existent que sur le site privé.
- Surcharger Nyaa : peu de requêtes à la fois, pauses, cache.

## Volume attendu

Site privé : 5 à 10 personnes (propriétaire, 2026-11-22). Extension : inconnu, chaque installation interroge Nyaa avec sa propre IP, donc sans charge sur notre serveur.
