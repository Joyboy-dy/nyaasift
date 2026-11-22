/**
 * Geist pour l'interface insérée dans nyaa.si, AniList et MyAnimeList : une @font-face déclarée
 * dans un Shadow DOM est ignorée, la police est donc ajoutée au document sous un nom à nous.
 */
import geist from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import mono from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url";

export function loadPageFonts(): void {
  const faces: [string, string][] = [
    ["nyaasift Geist", geist],
    ["nyaasift Geist Mono", mono],
  ];
  for (const [family, url] of faces) {
    // shortcut: les content scripts sont construits en mode bibliothèque, Vite y inline la police
    // en data: ; si un jour c'est un chemin, passer par runtime.getURL et web_accessible_resources
    const face = new FontFace(family, `url("${url}")`, { weight: "100 900" });
    document.fonts.add(face);
    // police refusée par la page : la barre garde la police système
    face.load().catch(() => undefined);
  }
}
