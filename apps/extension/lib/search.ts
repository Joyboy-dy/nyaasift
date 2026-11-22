/**
 * Recherche depuis le navigateur de l'utilisateur : AniList pour l'anime, puis le flux RSS de Nyaa
 * sous chacun de ses titres. Une requête Nyaa à la fois, espacées, pause après un 429, cache 5 min.
 */
import { storage } from "#imports";
import {
  animeById,
  findAnime,
  FR_QUERY,
  parseRss,
  searchUrl,
  type Anime,
  type Filters,
  type NyaaItem,
} from "@nyaasift/shared";

const GAP = 800; // ms entre deux requêtes Nyaa
const PAUSE = 30_000; // après un 429
const TTL = 5 * 60_000;

export const NYAA_LIMIT = "Nyaa limite les requêtes, réessaie dans 30 s";
export const NYAA_DOWN = "Nyaa ne répond pas, réessaie dans 30 s";
const NYAA_CHECK = "Nyaa demande une vérification : ouvre nyaa.si dans un onglet, puis réessaie";

/** Erreur dont le message s'affiche tel quel. */
class SearchError extends Error {}

type Entry = { at: number; value: unknown };
const CACHE = "session:cache";
const memory = new Map<string, Entry>();

async function readCache(): Promise<Record<string, Entry>> {
  try {
    return (await storage.getItem<Record<string, Entry>>(CACHE)) ?? {};
  } catch {
    return {}; // content script sans accès à storage.session : mémoire seulement
  }
}

/** Cache partagé entre le panneau et les pages (storage.session), doublé d'un cache en mémoire. */
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memory.get(key) ?? (await readCache())[key];
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await load();
  const now = Date.now();
  const entry = { at: now, value };
  memory.set(key, entry);
  const fresh = Object.entries(await readCache()).filter(([, e]) => now - e.at < TTL);
  await storage
    .setItem(CACHE, { ...Object.fromEntries(fresh), [key]: entry })
    .catch(() => undefined);
  return value;
}

let queue: Promise<unknown> = Promise.resolve();
let last = 0;
let pausedUntil = 0;

function fetchRss(url: string): Promise<NyaaItem[]> {
  const run = async () => {
    if (Date.now() < pausedUntil) throw new SearchError(NYAA_LIMIT);
    const wait = last + GAP - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    const res = await fetch(url, {
      credentials: "include", // cookies anti-DDoS de Nyaa déjà posés dans le navigateur
      signal: AbortSignal.timeout(15_000),
    }).catch(() => {
      throw new SearchError(NYAA_DOWN);
    });
    if (res.status === 429) {
      pausedUntil = Date.now() + PAUSE;
      throw new SearchError(NYAA_LIMIT);
    }
    if (!res.ok) throw new SearchError(NYAA_DOWN);
    const xml = await res.text();
    if (!xml.includes("<rss")) throw new SearchError(NYAA_CHECK);
    return parseRss(xml);
  };
  const p = queue.then(run, run);
  queue = p.catch(() => undefined);
  return p;
}

export type Lookup = { anime: Anime | null; matches: Anime[]; anilistDown: boolean };

/** L'anime reconnu par AniList (le plus populaire d'abord) ; AniList en panne n'arrête rien. */
export async function lookupAnime(q: string, anilistId?: number): Promise<Lookup> {
  try {
    if (anilistId) {
      const a = await cached(`anilist:id:${anilistId}`, () => animeById(anilistId));
      return { anime: a, matches: a ? [a] : [], anilistDown: false };
    }
    const matches = await cached(`anilist:${q.toLowerCase()}`, () => findAnime(q));
    return { anime: matches[0] ?? null, matches, anilistDown: false };
  } catch {
    return { anime: null, matches: [], anilistDown: true };
  }
}

export type NyaaResult = { items: NyaaItem[]; error: string | null };

/** Cherche chaque titre sur Nyaa, avec en plus les mots du français si une langue est choisie. */
export async function searchNyaa(
  titles: string[],
  lang: Filters["lang"],
  opts: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
): Promise<NyaaResult> {
  const queries = titles.flatMap((t) => (lang === "toutes" ? [t] : [t, `${t} ${FR_QUERY}`]));
  const items: NyaaItem[] = [];
  for (const [i, q] of queries.entries()) {
    if (opts.signal?.aborted) break;
    opts.onProgress?.(i, queries.length);
    try {
      items.push(...(await cached(`nyaa:${q}`, () => fetchRss(searchUrl(q, { rss: true })))));
    } catch (e) {
      return { items, error: e instanceof SearchError ? e.message : NYAA_DOWN };
    }
  }
  return { items, error: null };
}
