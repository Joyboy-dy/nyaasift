# Publier l'extension sur le Chrome Web Store

Exigences relues dans la documentation officielle de Google le 22 novembre 2026
(developer.chrome.com/docs/webstore). Elles changent : relire la page « Prepare your listing » avant d'envoyer.

## Avant de commencer

1. **Rendre le dépôt public** (ou héberger `PRIVACY.md` ailleurs) : la fiche exige l'adresse d'une politique de confidentialité lisible par tous, et celle de nyaasift est https://github.com/Joyboy-dy/nyaasift/blob/main/PRIVACY.md.
   ```bash
   gh repo edit Joyboy-dy/nyaasift --visibility public --accept-visibility-change-consequences
   ```
2. **Compte développeur** : https://chrome.google.com/webstore/devconsole avec un compte Google, accepter le contrat, payer les frais d'inscription (paiement unique, montant affiché à l'inscription). Activer la validation en deux étapes du compte Google, exigée pour publier.
3. **Construire le paquet** depuis la racine du dépôt :
   ```bash
   bun run --cwd apps/extension zip   # → apps/extension/.output/nyaasiftextension-0.1.0-chrome.zip
   ```
   Pour chaque nouvelle version : augmenter `version` dans `apps/extension/package.json`, puis refaire le zip.

## Envoyer

Console → **Add new item** → déposer le zip. Puis remplir les onglets.

### Store Listing (fiche)

- **Langue** : français. Une fiche en anglais demande d'abord de traduire l'extension (dossier `_locales`) : le texte anglais plus bas servira ce jour-là.
- **Catégorie** : Outils (*Tools*).
- **Icône** : `docs/store/icon-128.png` (128 × 128, dessin de 96 × 96 et 16 px de marge transparente, comme l'exige Google).
- **Captures** : 1 à 5, en **1280 × 800** (ou 640 × 400), PNG ou JPEG, sans bord arrondi. À faire, dans cet ordre :
  1. le panneau latéral avec les résultats de « frieren » (packs, épisodes, filtres) ;
  2. la barre nyaasift sous la recherche de nyaa.si ;
  3. une recherche vide de nyaa.si rattrapée (« saga tanya » → *Youjo Senki*) ;
  4. le bouton « Chercher sur Nyaa » sur une fiche AniList ;
  5. la page des réglages.
- **Vignette promotionnelle** (440 × 280) et **bannière** (1400 × 560) : facultatives, utiles seulement pour être mis en avant.
- **Site** : l'adresse du dépôt GitHub.

**Description courte** (132 caractères au plus, c'est la `description` du manifeste) :

> Retrouve l'anime sous tous ses noms et range les releases de Nyaa : VF, MULTi ou VOSTFR, par pack, épisode et film.

**Description longue (français)** :

> Tape le titre comme il te vient : nyaasift retrouve l'anime, cherche sur Nyaa sous tous ses noms et range les releases en français.
>
> « saga tanya » ne donne rien sur Nyaa. nyaasift reconnaît Youjo Senki grâce à AniList, cherche sous ses vrais titres, puis range le résultat : films, packs de saison, et épisodes dans l'ordre avec la meilleure release de chacun.
>
> • Un panneau latéral de recherche, ouvert d'un clic sur l'icône
> • Filtres VF, MULTi ou VOSTFR, qualité 1080p, 720p, 4K, saison
> • Une barre discrète sous la recherche de nyaa.si, qui rattrape les recherches vides
> • Un bouton « Chercher sur Nyaa » sur AniList et MyAnimeList
>
> Tout se passe dans ton navigateur : les recherches partent de ton IP vers AniList et nyaa.si, et nulle part ailleurs. Aucun compte, aucun pistage, aucune statistique. nyaasift ne télécharge rien et n'héberge aucun fichier : il donne les liens vers les pages de Nyaa et les liens magnet.
>
> Logiciel libre (MIT). Non affilié à Nyaa ni à AniList.

**Description longue (anglais)** :

> Type the title the way you remember it: nyaasift finds the anime, searches Nyaa under all of its names and sorts French releases (VF, MULTi, VOSTFR) into movies, season packs and episodes.
>
> "saga tanya" finds nothing on Nyaa. nyaasift recognises Youjo Senki through AniList, searches under its real titles, then sorts the results: movies, season packs, and episodes in order with the best release of each.
>
> • A search side panel, one click on the toolbar icon
> • Filters for VF, MULTi or VOSTFR, 1080p, 720p, 4K, season
> • A small bar under the nyaa.si search that rescues empty searches
> • A "Search on Nyaa" button on AniList and MyAnimeList
>
> Everything runs in your browser: searches go from your own IP to AniList and nyaa.si, nowhere else. No account, no tracking, no analytics. nyaasift downloads nothing and hosts no files: it links to Nyaa pages and magnet links.
>
> Open source (MIT). Not affiliated with Nyaa or AniList.

### Privacy (pratiques de confidentialité)

**Objectif unique** (*single purpose*) :

> Rechercher des releases d'anime sur nyaa.si à partir d'un titre approximatif, et les ranger par langue française, film, pack de saison et épisode.

**Justification de chaque permission** :

| Permission | Justification à coller |
| --- | --- |
| `storage` | Garder les réglages de l'utilisateur (langue, qualité, sites où l'extension agit) dans le stockage du navigateur. |
| `sidePanel` | Afficher la recherche nyaasift dans le panneau latéral, ouvert en cliquant sur l'icône. |
| `https://nyaa.si/*` | Chercher les releases sur Nyaa et ajouter une barre de recherche nyaasift sous la recherche du site. |
| `https://graphql.anilist.co/*` | Retrouver l'anime et ses titres alternatifs à partir du titre tapé, via l'API publique d'AniList. |
| `https://anilist.co/*` | Ajouter un bouton « Chercher sur Nyaa » sur les fiches d'anime d'AniList. |
| `https://myanimelist.net/*` | Ajouter un bouton « Chercher sur Nyaa » sur les fiches d'anime de MyAnimeList. |

**Code distant** (*remote code*) : **Non**, tout le code est dans le paquet.

**Données collectées** : ne cocher **aucune** catégorie. Cocher les trois certifications : pas de vente à des tiers, pas d'usage étranger à l'objectif unique, pas d'usage pour un crédit ou un prêt.

**Politique de confidentialité** : https://github.com/Joyboy-dy/nyaasift/blob/main/PRIVACY.md

### Distribution

- **Visibilité** : *Public* ; ou *Unlisted* (non répertoriée, installable seulement avec le lien) pour commencer entre amis.
- **Pays** : tous.

### Test instructions (instructions pour l'examinateur)

> No account needed. Click the toolbar icon to open the side panel, type "saga tanya" (or "frieren") and press Enter: the extension finds the anime on AniList and lists French releases from nyaa.si. On https://nyaa.si, search "saga tanya": the empty results page shows the nyaasift bar with the found releases. On an AniList anime page (e.g. https://anilist.co/anime/154587), a "Chercher sur Nyaa" button opens the panel.

## Après l'envoi

- **Examen** : de quelques jours à quelques semaines. Il est plus long pour un nouveau compte et pour une extension qui demande l'accès à des sites (c'est notre cas).
- **Risque à connaître** : Nyaa sert surtout à partager des torrents d'œuvres protégées. Google peut refuser une extension jugée comme facilitant l'accès à du contenu contrefait. Les arguments à faire valoir : nyaasift ne télécharge et n'héberge rien, c'est un outil de recherche et de tri d'un site public. En cas de refus : publier la version *Unlisted*, ou passer par Firefox (ci-dessous).
- **Une fois publiée** : copier l'adresse de la fiche (`https://chromewebstore.google.com/detail/nyaasift/<id>`) dans `CHROME_EXTENSION_URL` sur Dokploy et redéployer. Le bouton « Installer l'extension » du site pointe alors vers la fiche au lieu des instructions GitHub.

## Firefox (addons.mozilla.org)

```bash
bun run --cwd apps/extension zip:firefox   # → .output/nyaasiftextension-0.1.0-firefox.zip (+ sources)
```

https://addons.mozilla.org/developers → *Submit a New Add-on* : *On this site* (public, avec examen) ou *On your own* (signée, non listée, à distribuer soi-même, souvent validée en quelques minutes). Mozilla demande aussi le zip des sources, produit par la même commande.
