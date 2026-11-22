/**
 * Requêtes vers Nyaa depuis le serveur, avec les garde-fous qui évitent qu'il nous bloque :
 * cache 5 min, une requête à la fois avec un délai minimal, coupe-circuit après un refus.
 */
import { NYAA, NYAA_PAGE_SIZE, parseRss, searchUrl, type NyaaItem } from "@nyaasift/shared";

const CACHE_MS = 5 * 60 * 1000;
const GAP_MS = 1000; // délai minimal entre deux requêtes vers Nyaa (Jackett en espace de même)
const MAX_EXTRA_PAGES = 3; // au-delà des 75 du flux RSS : 300 releases par recherche au plus
const UA = "nyaasift/0.1 (+https://github.com/Joyboy-dy/nyaasift)";

type Entry = { at: number; items: NyaaItem[] };
const cache = new Map<string, Entry>();

let last = 0;
let chain: Promise<unknown> = Promise.resolve();
let openUntil = 0; // coupe-circuit ouvert jusqu'à cette date
let backoff = 60_000;

export class NyaaUnavailable extends Error {
  constructor(public retryInSec: number) {
    super(`Nyaa ne répond pas pour l'instant, réessaie dans ${retryInSec} s`);
  }
}

/** File : une requête à la fois, espacées d'au moins GAP_MS. */
function queued<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = last + GAP_MS - Date.now();
    if (wait > 0) await Bun.sleep(wait);
    try {
      return await task();
    } finally {
      last = Date.now();
    }
  });
  chain = run.catch(() => undefined);
  return run;
}

async function fetchText(url: string): Promise<string> {
  if (Date.now() < openUntil) throw new NyaaUnavailable(Math.ceil((openUntil - Date.now()) / 1000));
  return queued(async () => {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    // 429, 5xx, ou page de défi ddos-guard : on ouvre le coupe-circuit, avec un délai qui double
    if (
      res.status === 429 ||
      res.status >= 500 ||
      (res.status === 403 && /ddos-guard/i.test(text))
    ) {
      openUntil = Date.now() + backoff;
      backoff = Math.min(backoff * 2, 10 * 60_000);
      throw new NyaaUnavailable(Math.ceil(backoff / 2000));
    }
    if (!res.ok) throw new Error(`Nyaa a répondu ${res.status}`);
    backoff = 60_000;
    return text;
  });
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

/** Lit une page HTML de résultats de Nyaa (tableau torrent-list). */
export function parseHtmlPage(html: string): NyaaItem[] {
  const items: NyaaItem[] = [];
  for (const m of html.matchAll(/<tr class="(default|success|danger)">([\s\S]*?)<\/tr>/g)) {
    const row = m[2] ?? "";
    const link = /<a href="\/view\/(\d+)" title="([^"]*)">/.exec(row);
    const hash = /btih:([0-9a-f]{40})/i.exec(row);
    const cells = [...row.matchAll(/<td class="text-center"[^>]*>([^<]*)<\/td>/g)].map(
      (c) => c[1]?.trim() ?? "",
    );
    const ts = /data-timestamp="(\d+)"/.exec(row);
    if (!link?.[1] || !hash?.[1] || cells.length < 4) continue;
    items.push({
      id: Number(link[1]),
      title: decode(link[2] ?? ""),
      size: cells[0] ?? "",
      date: ts?.[1] ? new Date(Number(ts[1]) * 1000).toISOString() : "",
      seeders: Number(cells[2]) || 0,
      leechers: Number(cells[3]) || 0,
      infoHash: hash[1].toLowerCase(),
      trusted: m[1] === "success",
      remake: m[1] === "danger",
    });
  }
  return items;
}

async function searchOne(q: string): Promise<NyaaItem[]> {
  const items = parseRss(await fetchText(searchUrl(q, { rss: true })));
  // Le flux RSS s'arrête à 75 : on lit les pages suivantes (même ordre, les plus récentes d'abord)
  for (
    let page = 2;
    items.length >= NYAA_PAGE_SIZE * (page - 1) && page <= MAX_EXTRA_PAGES + 1;
    page++
  ) {
    const url = `${NYAA}/?${new URLSearchParams({ f: "0", c: "1_0", q, p: String(page) })}`;
    const more = parseHtmlPage(await fetchText(url));
    items.push(...more);
    if (more.length < NYAA_PAGE_SIZE) break;
  }
  return items;
}

export type SearchOutcome = { items: NyaaItem[]; fetchedAt: number; stale: boolean };

/** Cherche chaque requête (cache d'abord). Si Nyaa refuse, sert le cache même périmé, avec son heure. */
export async function searchNyaa(queries: string[]): Promise<SearchOutcome> {
  const all: NyaaItem[] = [];
  let oldest = Date.now();
  let stale = false;
  for (const q of queries) {
    const key = q.toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      all.push(...hit.items);
      oldest = Math.min(oldest, hit.at);
      continue;
    }
    try {
      const items = await searchOne(q);
      cache.set(key, { at: Date.now(), items });
      all.push(...items);
    } catch (e) {
      if (!(e instanceof NyaaUnavailable) || !hit) throw e;
      all.push(...hit.items);
      oldest = Math.min(oldest, hit.at);
      stale = true;
    }
  }
  return { items: all, fetchedAt: oldest, stale };
}

/** Limite par compte : 20 recherches par minute (seau de jetons en mémoire). */
const buckets = new Map<string, { tokens: number; at: number }>();
export function takeSearchToken(userId: string): number {
  const RATE = 20 / 60_000;
  const now = Date.now();
  const b = buckets.get(userId) ?? { tokens: 20, at: now };
  b.tokens = Math.min(20, b.tokens + (now - b.at) * RATE);
  b.at = now;
  buckets.set(userId, b);
  if (b.tokens < 1) return Math.ceil((1 - b.tokens) / RATE / 1000);
  b.tokens -= 1;
  return 0;
}
