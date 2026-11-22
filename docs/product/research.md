# nyaasift · recherche (2026-11-22)

Deux recherches menées le 2026-11-22. Étoiles et dates : API GitHub. Licences : fichier LICENSE de chaque dépôt, sauf mention contraire.

## Concurrents

Aucun concurrent complet trouvé : chacun couvre un morceau du besoin. 3 proches, 4 indirects.

| Nom | Ce qu'il fait | Public | Fonctionnalités phares | Prix | Ce qui le démarque | Source |
|---|---|---|---|---|---|---|
| PyNyaaTa | Moteur web auto-hébergé de recherche d'animes en torrent (Nyaa.si, Anime-Ultime) | Francophones, à héberger soi-même | Multi-sources, liens TheTVDB/Nautiljon, Docker | Gratuit | Francophone. Dernière version oct. 2023 ; ni filtre VF/VOSTFR ni AniList | https://git.crystalyx.net/Xefir/PyNyaaTa |
| AniList Releases | Extension : panneaux SeaDex + Nyaa sous une fiche AniList | Anglophones d'AniList (149 utilisateurs) | Releases sur la fiche AniList | Gratuit | Identification exacte par AniList ; aucun filtre de langue | https://chromewebstore.google.com/detail/blclflofdjaghfcdjilfbfdllcgicapb |
| Nyaa Linker | Extension : bouton « Search on Nyaa » sur MAL, AniList, Kitsu… | Anglophones | Modes de requête, raccourci, userscript | Gratuit, GPL-3.0 | Multi-sites, mais une seule requête brute, sans filtre | https://github.com/Metacor/nyaa-linker |
| Seanime *(indirect)* | Serveur de médias anime auto-hébergé, construit sur AniList | Collectionneurs | Recherche Nyaa/AnimeTosho, SeaDex, téléchargement auto, lecteur | Gratuit, GPL-3.0, 4,3k ★ | Meilleure association AniList → releases, mais application lourde ; limite 75 du RSS signalée par un utilisateur | https://github.com/5rahim/seanime · https://github.com/5rahim/seanime/issues/679 |
| SeaDex / releases.moe *(indirect)* | Index des meilleures releases par anime, clé = ID AniList | Amateurs de qualité | Curation humaine, API REST | Gratuit, MIT | Une sélection, pas tout Nyaa | https://github.com/ravencentric/releases-moe |
| FreeFlix CLI *(indirect)* | Application de terminal multi-sources (dont Nyaa) | FR/EN à l'aise au terminal | VF/VOSTFR/VO sur ses sources de streaming, saisons entières, AniList | Gratuit, GPL-3.0 | Pas d'interface web | https://pypi.org/project/freeflix-cli/ |
| Prowlarr + Sonarr *(indirect)* | Gestion d'indexeurs + téléchargement automatique | Collections automatisées | 500+ trackers, RSS, renommage | Gratuit, GPL-3.0 | Configuration lourde, pas de recherche ponctuelle | https://github.com/Prowlarr/Prowlarr · https://github.com/Sonarr/Sonarr |

Vus, non retenus : Taiga (suivi de visionnage), Shoko (métadonnées de fichiers locaux), Anime Tosho (mises à jour arrêtées depuis le 2026-05-09).

## Ce que le marché attend · ce que personne ne fait bien

- **Minimum attendu** : mener à Nyaa pour un titre donné, parfois via AniList.
- **Personne ne fait bien** : filtrer par VF / MULTi / VOSTFR ; résoudre un titre français ou approximatif en une recherche ; séparer films, packs et épisodes dans une interface web simple.
- **Les meilleurs** : identification exacte par l'ID AniList (AniList Releases, SeaDex, Seanime).

## Open source

| Projet | Dépôt | Activité | Stack | Licence | Usage permis | Fonctionnalités utiles (liens) |
|---|---|---|---|---|---|---|
| nyaax | https://github.com/gensimone/nyaax | push 2025-12-17, v0.1.2, 1 ★ | Python | MIT | Reprise possible avec mention | HTML + RSS : `nyaax/extractors.py` |
| NyaaPy | https://github.com/JuanjoSalvador/NyaaPy | push 2026-05-20, PyPI 0.7 (2024-07), 67 ★ | Python | MIT | Reprise possible avec mention | Scraping HTML : `nyaapy/nyaasi/parser.py` |
| nyaascraper | https://github.com/zrekryu/nyaascraper | push 2025-03-13, 8 ★ | Python async | MIT | Reprise possible avec mention | Recherche, tri, pages, RSS |
| Jackett | https://github.com/Jackett/Jackett | v0.25.24 (2026-11-22), 16,4k ★ | C# | GPL-2.0 | Inspiration seulement | Paramètres Nyaa `q, f, c, s, o, p` et délai entre requêtes : [nyaasi.yml](https://github.com/Jackett/Jackett/blob/master/src/Jackett.Common/Definitions/nyaasi.yml) |
| Sonarr | https://github.com/Sonarr/Sonarr | v5.0.0 (2026-11-17), 17,8k ★ | C# | GPL-3.0 | Inspiration seulement | [Parser](https://github.com/Sonarr/Sonarr/tree/develop/src/NzbDrone.Core/Parser), [LanguageParser.cs](https://github.com/Sonarr/Sonarr/blob/develop/src/NzbDrone.Core/Parser/LanguageParser.cs) (VF, VFF, VFQ, TRUEFRENCH ; ni MULTi ni VOSTFR, à relire) |
| Seanime | https://github.com/5rahim/seanime | v3.10.5 (2026-11-21), 4,3k ★ | Go + web | GPL-3.0 | Inspiration seulement | [Client AniList](https://github.com/5rahim/seanime/tree/main/internal/api/anilist), [analyse de torrents](https://github.com/5rahim/seanime/tree/main/internal/torrents) |
| Anitomy / Anitopy | https://github.com/erengy/anitomy · https://github.com/igorcmoura/anitopy | Anitomy push 2026-07 ; Anitopy 2024-04 | C++ / Python | MPL-2.0 | Inspiration seulement, à vérifier avant reprise | Référence de l'analyse de noms de releases d'anime |
| anime-offline-database | https://github.com/manami-project/anime-offline-database | **archivé le 2026-07-04** | Données JSON | ODbL 1.0 | À vérifier avant reprise (partage à l'identique) | Titres et synonymes sans appel d'API |
| Nyaa (le site) | https://github.com/nyaadevs/nyaa | push 2024-07 | Python/Flask | GPL-3.0 (classement GitHub, fichier non lu) | Inspiration seulement | `config.example.py`, `search.py` : 75 résultats par page, RSS limité à la 1re page |

## Ce que la recherche apprend pour nyaasift

- La **limite de 75 résultats du RSS** est confirmée par le code de Nyaa ; les pages HTML (`&p=`) la contournent. Le nombre maximal de pages sur nyaa.si n'est pas public (100 dans la config d'exemple) : **à tester**.
- La **limite de débit** de nyaa.si n'est pas documentée. Nos tests ont reçu des 429 à 8 requêtes parallèles. Jackett espace ses requêtes ; Nyaa met ses recherches en cache 5 minutes (`Cache-Control: max-age=300`).
- **Aucun parseur libre ne gère MULTi et VOSTFR** : cette partie est à écrire nous-mêmes (déjà commencée dans le prototype).
- Les trois bibliothèques Python Nyaa sont sous MIT, mais petites et peu suivies : on peut s'en inspirer ou en reprendre des morceaux avec la mention.

## Ce qui n'a pas été trouvé

- Licence et activité de PyNyaaTa (dépôt inaccessible) : on n'en reprend rien.
- Seuil réel du 429 et nombre maximal de pages sur nyaa.si.
- Fichier exact du fournisseur Nyaa dans Seanime et dans Prowlarr/Indexers.
- Aucun outil francophone récent dédié à Nyaa avec filtres VF/MULTi/VOSTFR.
