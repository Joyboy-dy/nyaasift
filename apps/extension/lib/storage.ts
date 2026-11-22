/** Ce que l'extension garde : réglages (sync) et recherche à ouvrir dans le panneau (session). */
import { browser, storage } from "#imports";
import { parseSettings, type Settings } from "./settings";

const SETTINGS = "sync:settings";
const PENDING = "session:pendingSearch";

export async function loadSettings(): Promise<Settings> {
  return parseSettings(await storage.getItem(SETTINGS));
}

export function saveSettings(s: Settings): Promise<void> {
  return storage.setItem(SETTINGS, s);
}

export function watchSettings(cb: (s: Settings) => void): () => void {
  return storage.watch(SETTINGS, (v) => cb(parseSettings(v)));
}

/** D'où vient la recherche : la barre de nyaa.si (avec ou sans résultats), AniList, MyAnimeList. */
export type Origin = "nyaa" | "nyaa-empty" | "anilist" | "mal";
export type PendingSearch = { q: string; anilistId?: number; from: Origin };

const ORIGINS: readonly string[] = ["nyaa", "nyaa-empty", "anilist", "mal"];

/** Valide une recherche reçue d'un content script ou relue du stockage. */
export function parsePending(raw: unknown): PendingSearch | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const q = typeof r.q === "string" ? r.q.trim().slice(0, 200) : "";
  const from = typeof r.from === "string" && ORIGINS.includes(r.from) ? (r.from as Origin) : null;
  if (!q || !from) return null;
  const id = Number(r.anilistId);
  return Number.isInteger(id) && id > 0 ? { q, from, anilistId: id } : { q, from };
}

export function setPending(s: PendingSearch): Promise<void> {
  return storage.setItem(PENDING, s);
}

/** Lit la recherche en attente et l'efface : elle ne sert qu'une fois. */
export async function takePending(): Promise<PendingSearch | null> {
  const s = parsePending(await storage.getItem(PENDING));
  if (s) await storage.removeItem(PENDING);
  return s;
}

export function watchPending(cb: () => void): () => void {
  return storage.watch(PENDING, (v) => {
    if (v) cb();
  });
}

/** Message d'un content script : ouvrir le panneau sur cette recherche. */
export const OPEN_PANEL = "nyaasift:open-panel";

export function requestPanel(search: PendingSearch): Promise<unknown> {
  // pas de réponse attendue : Chrome rejette quand le service worker ne répond rien
  return browser.runtime.sendMessage({ type: OPEN_PANEL, search }).catch(() => undefined);
}
