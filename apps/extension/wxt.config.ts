import { defineConfig } from "wxt";

const SITES = ["https://nyaa.si/*", "https://anilist.co/*", "https://myanimelist.net/*"];

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: ({ browser }) => ({
    name: "nyaasift",
    description:
      "Retrouve l'anime sous tous ses noms et range les releases de Nyaa : VF, MULTi ou VOSTFR, par pack, épisode et film.",
    // icônes provisoires dans public/icon/
    action: { default_title: "nyaasift" },
    permissions: browser === "firefox" ? ["storage"] : ["storage", "sidePanel"],
    host_permissions: [...SITES, "https://graphql.anilist.co/*"],
    // Firefox : identifiant fixe, exigé pour storage.sync et pour la signature sur addons.mozilla.org
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: { id: "nyaasift@nyaasift.extension", strict_min_version: "115.0" },
          },
        }
      : {}),
  }),
});
