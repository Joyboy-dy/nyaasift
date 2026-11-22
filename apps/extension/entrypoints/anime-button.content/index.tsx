import "./style.css";
import { useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { IconLoader2 } from "@tabler/icons-react";
import { createShadowRootUi, defineContentScript, type ContentScriptAppendMode } from "#imports";
import { loadPageFonts } from "@/lib/fonts";
import { loadSettings, requestPanel, type PendingSearch } from "@/lib/storage";

type Site = {
  /** Sélecteur sous lequel placer le bouton, ou null si la page n'est pas une fiche d'anime. */
  anchor: () => string | null;
  append: ContentScriptAppendMode;
  /** Lu au clic : AniList change d'adresse sans recharger la page. */
  search: () => PendingSearch | null;
};

const text = (sel: string) => document.querySelector(sel)?.textContent?.trim() ?? "";

const ANILIST: Site = {
  anchor: () => (/^\/anime\/\d+/.test(location.pathname) ? ".header .content h1" : null),
  append: "after",
  search: () => {
    const id = Number(/^\/anime\/(\d+)/.exec(location.pathname)?.[1]);
    const q = text(".header .content h1");
    return id && q ? { q, anilistId: id, from: "anilist" } : null;
  },
};

// MyAnimeList : le titre seulement, AniList le retrouve dans le panneau
const MAL: Site = {
  anchor: () => (document.querySelector("h1.title-name") ? '.h1-title [itemprop="name"]' : null),
  append: "last",
  search: () => {
    const q = text("h1.title-name");
    return q ? { q, from: "mal" } : null;
  },
};

function SearchButton({ site }: { site: Site }) {
  const [busy, setBusy] = useState(false);
  return (
    <span className="wrap">
      <button
        type="button"
        className="nsbtn"
        aria-busy={busy}
        onClick={() => {
          const s = site.search();
          if (!s) return;
          setBusy(true);
          void requestPanel(s).then(() => setTimeout(() => setBusy(false), 1500));
        }}
      >
        {busy ? (
          <IconLoader2 className="spin" size={16} stroke={1.5} aria-hidden="true" />
        ) : (
          <span className="dot" aria-hidden="true" />
        )}
        {busy ? "Ouverture du panneau" : "Chercher sur Nyaa"}
      </button>
    </span>
  );
}

/** Bouton « Chercher sur Nyaa » sous le titre des fiches AniList et MyAnimeList. */
export default defineContentScript({
  matches: ["https://anilist.co/*", "https://myanimelist.net/anime/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    if (!(await loadSettings()).siteButton) return;
    const site = location.hostname === "anilist.co" ? ANILIST : MAL;
    loadPageFonts();
    const ui = await createShadowRootUi<Root>(ctx, {
      name: "nyaasift-button",
      position: "inline",
      anchor: site.anchor,
      append: site.append,
      onMount(el) {
        const root = createRoot(el);
        root.render(<SearchButton site={site} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    // monte et retire le bouton quand AniList (application d'une seule page) change d'écran
    ui.autoMount();
  },
});
