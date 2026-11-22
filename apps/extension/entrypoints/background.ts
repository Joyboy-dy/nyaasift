import { browser, defineBackground } from "#imports";
import { OPEN_PANEL, parsePending, setPending } from "@/lib/storage";

/** Firefox seulement : l'API de la barre latérale n'est pas dans les types de Chrome. */
type SidebarAction = { toggle(): Promise<void> };
const sidebarAction = (browser as unknown as { sidebarAction?: SidebarAction }).sidebarAction;

export default defineBackground(() => {
  if (import.meta.env.FIREFOX) {
    // un clic sur l'icône ouvre ou ferme la barre latérale
    (browser.action ?? browser.browserAction).onClicked.addListener(() => {
      void sidebarAction?.toggle();
    });
  } else {
    void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    // le cache de recherche (storage.session) sert aussi aux content scripts
    void browser.storage.session.setAccessLevel({
      accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
    });
  }

  browser.runtime.onMessage.addListener((msg: unknown, sender) => {
    if (!msg || typeof msg !== "object" || (msg as { type?: unknown }).type !== OPEN_PANEL) return;
    const search = parsePending((msg as { search?: unknown }).search);
    const tabId = sender.tab?.id;
    if (!search || tabId === undefined) return;
    if (import.meta.env.FIREFOX) {
      // Firefox n'ouvre pas la barre latérale depuis un message : le panneau s'ouvre dans un onglet
      void setPending(search).then(() =>
        browser.tabs.create({ url: browser.runtime.getURL("/sidepanel.html") }),
      );
    } else {
      // appelé tout de suite, sans attendre : Chrome exige le geste de l'utilisateur
      void browser.sidePanel.open({ tabId });
      void setPending(search);
    }
  });
});
