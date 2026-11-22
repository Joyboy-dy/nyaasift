# nyaasift · extension Chrome et Firefox

Panneau latéral de recherche, barre discrète sur nyaa.si, bouton « Chercher sur Nyaa » sur AniList et MyAnimeList, réglages. Tout se passe dans le navigateur : l'extension parle seulement à nyaa.si et à AniList.

```bash
bun run dev:chrome      # navigateur de test avec l'extension (ou dev:firefox)
bun run build           # → .output/chrome-mv3
bun run build:firefox   # → .output/firefox-mv2
bun run zip && bun run zip:firefox   # paquets à publier
```

Le cœur (lecture des noms, rangement, AniList, flux Nyaa) vient de `packages/shared`. Voir le README à la racine du dépôt.
