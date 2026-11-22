import "./style.css";
import { createRoot, type Root } from "react-dom/client";
import { createShadowRootUi, defineContentScript } from "#imports";
import type { NyaaItem } from "@nyaasift/shared";
import { loadPageFonts } from "@/lib/fonts";
import { readNyaaTable } from "@/lib/nyaa-page";
import { loadSettings } from "@/lib/storage";
import { Bar } from "./Bar";

/** Barre nyaasift sous la recherche de nyaa.si. La page de Nyaa n'est pas modifiée. */
export default defineContentScript({
  matches: ["https://nyaa.si/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const q = new URL(location.href).searchParams.get("q")?.trim();
    if (!q) return;
    const settings = await loadSettings();
    if (!settings.nyaaBar) return;

    const container = document.querySelector("body > .container");
    const table = container?.querySelector("table.torrent-list");
    let items: NyaaItem[] | null = null;
    if (table) {
      items = readNyaaTable(table.outerHTML);
      if (!items) return; // Nyaa a changé sa page : repli silencieux
    } else if (!settings.rescue || !/No results found/.test(container?.textContent ?? "")) {
      return;
    }

    loadPageFonts();
    const ui = await createShadowRootUi<Root>(ctx, {
      name: "nyaasift-bar",
      position: "inline",
      anchor: container,
      append: "first",
      onMount(el) {
        const root = createRoot(el);
        root.render(
          <Bar q={q} filters={settings.filters} items={items} onClose={() => ui.remove()} />,
        );
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
