# nyaasift · brief

## L'idée (mots du propriétaire)

> Je veux construire un moteur de recherche nyaa assez puissant parce que je ne trouve pas celui du site plus pratique. Parfois je cherche des animes, par exemple : saga tanya ou autre, et ça me retourne vide. En fait il faut une façon de chercher, mais moi je préfère être direct.
>
> L'idée, c'est qu'il comprenne l'idée de la recherche derrière et qu'il recherche dans le bon format, qu'il fasse des jeux de compatibilité, qu'il calcule et qu'il extraie les ressources les plus pertinentes. Si je recherche une série animée ou un film, ça va me lister les films. Je peux vouloir chercher de la multi-VF ou de la VF, en tout cas pour avoir une voix française. Je dois pouvoir chercher et filtrer en fonction de ce que je veux, et en fonction de la qualité également.
>
> Quand je vais chercher, il va me sortir dans un tableau le nom, le lien direct vers la page de téléchargement, la taille, et le numéro de l'épisode ou le titre du film. S'il s'agit d'une série et qu'il y a dans la liste un fichier qui télécharge une saison entière, avec tous les épisodes, je dois avoir ça, mais à part, séparé de la liste des épisodes bien classés dans l'ordre.
>
> Faisons les choses correctement : un projet en bonne et due forme, rendu public sur GitHub, avec une interface HTML, CSS, JS intuitive, designée d'abord dans Claude Design.
>
> Finalement nous allons l'héberger sur notre serveur, même si d'autres pourront aussi l'utiliser en local s'ils veulent. Mais nous allons tout mettre en place pour qu'ils [Nyaa] ne bloquent jamais notre serveur.

## Point de départ

Un prototype Python qui fonctionne existe déjà : `docs/product/prototype/nyaa.py` (et son test `test_nyaa.py`). Il retrouve les titres alternatifs via AniList, interroge le flux RSS de Nyaa, filtre par langue, qualité, saison et type, et sépare films, packs et épisodes triés.

Limite connue : le flux RSS de Nyaa renvoie 75 résultats maximum par requête (confirmé par le code de Nyaa, voir `research.md`). Piste retenue : compléter par la lecture des pages HTML paginées.

## Problème

> Parfois je cherche des animes, par exemple : saga tanya ou autre, et ça me retourne vide.

La recherche de Nyaa ne trouve que les mots exacts du nom des fichiers : il faut connaître le titre romaji ou anglais choisi par les uploaders (« Youjo Senki », « Saga of Tanya the Evil »). Elle ne filtre ni par langue audio ni par saison, et mélange packs et épisodes dans le désordre.

## Public

Le propriétaire d'abord, puis les fans d'anime **francophones** qui cherchent de la VF, du MULTi ou de la VOSTFR sur Nyaa. Interface en français ; l'anglais viendra ensuite.

## Utilisation et hébergement (revu le 2026-11-22)

> Si l'extension est activée, nous allons complètement refaire ou repenser l'interface de NYAA pour ressembler aux maquettes qu'on a faites, pour que ce soit beaucoup plus simple à utiliser. […] On aura toujours une version hébergée sur un serveur VPS, mais ce sera utilisable uniquement entre nous, entre nos amis, une poignée de personnes, peut-être jusqu'à 5, 6 ou 10 personnes maximum. Pas pour un usage public, pour un usage privé en interne.

1. **L'extension (Chrome et Firefox) est le produit public**, développée en même temps que le site :
   - elle remplace la page de recherche de nyaa.si par l'interface de nyaasift ;
   - un panneau de recherche (titre approximatif, AniList, résultats rangés) depuis n'importe quel onglet ;
   - un bouton « Chercher sur Nyaa » sur les fiches AniList et MyAnimeList.
   Les requêtes vers Nyaa partent du navigateur de chacun, avec son IP.
2. **Le site hébergé est privé** : le propriétaire et 5 à 10 amis, **comptes sur invitation**.
3. **L'installation locale** reste possible (projet open source).
- Exigence maintenue pour le site privé : **Nyaa ne doit jamais bloquer le serveur** (cache, débit plafonné, pause après un refus, limite par personne).

## Promesse (proposé)

Tape le titre comme il te vient : nyaasift retrouve l'anime, cherche sur Nyaa sous tous ses noms, et range les releases VF, MULTi ou VOSTFR par film, pack de saison et épisode.

## Ce qui le distinguera (proposé, d'après la recherche)

- Le seul outil trouvé qui filtre **VF / MULTi / VOSTFR** sur Nyaa.
- Titre approximatif accepté : les vrais titres sont retrouvés via AniList.
- **Packs de saison séparés**, épisodes **dans l'ordre**, meilleure release par épisode.
- Pas de plafond à 75 résultats : lecture des pages suivantes de Nyaa quand il le faut.
- Une extension qui refait nyaa.si lui-même : on garde ses habitudes (aller sur nyaa.si), on gagne le rangement, avec sa propre IP.

## Ce qui doit marcher en premier

Chercher un titre approximatif, filtrer par langue et qualité, voir films, packs et épisodes triés, avec le lien vers la page Nyaa, la taille et les seeders.

## Hors du MVP et jamais

Voir `features.md`. Jamais : télécharger ou héberger des torrents, pister les visiteurs, surcharger Nyaa.

## Modèle économique

Aucun : outil gratuit et **open source**, publié sur GitHub. La licence se choisit à la phase stack.
