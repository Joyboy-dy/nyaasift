/** Lecture du tableau de résultats d'une page nyaa.si, et décompte affiché par la barre. */
import { rank, type Filters, type NyaaItem, type Ranked } from "@nyaasift/shared";
import { filtersPhrase, plural } from "./format";

function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const text = (cell: string) => decode(cell.replace(/<[^>]*>/g, "")).trim();

function readRow(row: string): NyaaItem | null {
  const cls = /^<tr[^>]*\bclass="([^"]*)"/.exec(row)?.[1] ?? "";
  const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[0]);
  const [, name, links, size, date, seeders, leechers] = cells;
  if (!name || !links || !size || !date || !seeders || !leechers) return null;
  // le lien de la release, pas celui des commentaires (/view/ID#comments)
  const view = /<a\b[^>]*\bhref="\/view\/(\d+)"[^>]*>/.exec(name);
  const title = view && /\btitle="([^"]*)"/.exec(view[0]);
  const hash = /magnet:\?xt=urn:btih:([0-9a-zA-Z]+)/.exec(links)?.[1];
  const ts = Number(/\bdata-timestamp="(\d+)"/.exec(date)?.[1]);
  const s = Number(text(seeders));
  const l = Number(text(leechers));
  if (!view?.[1] || !title?.[1] || !hash || !Number.isFinite(ts) || Number.isNaN(s + l)) {
    return null;
  }
  return {
    id: Number(view[1]),
    title: decode(title[1]).trim(),
    size: text(size),
    date: new Date(ts * 1000).toISOString(),
    seeders: s,
    leechers: l,
    infoHash: hash,
    trusted: /\bsuccess\b/.test(cls),
    remake: /\bdanger\b/.test(cls),
  };
}

/**
 * Lit le HTML du tableau `table.torrent-list`. Renvoie null si une ligne ne se lit pas :
 * Nyaa a changé sa page, la barre se cache plutôt que d'afficher un compte faux.
 */
export function readNyaaTable(html: string): NyaaItem[] | null {
  const body = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/.exec(html)?.[1];
  if (body === undefined) return null;
  const items: NyaaItem[] = [];
  for (const m of body.matchAll(/<tr\b[\s\S]*?<\/tr>/g)) {
    const item = readRow(m[0]);
    if (!item) return null;
    items.push(item);
  }
  return items;
}

export type Tally = { total: number; headline: string; detail: string };

/** Ce que la barre affiche : « 13 releases en voix FR 1080p », « 1 pack · 12 épisodes · S02 ». */
export function tally(ranked: Ranked, filters: Filters): Tally {
  const what = filtersPhrase(filters);
  const headline =
    ranked.total === 0
      ? `Aucune release${what ? ` ${what}` : ""}`
      : `${plural(ranked.total, "release")}${what ? ` ${what}` : ""}`;
  const seasons = [...new Set([...ranked.packs, ...ranked.episodes].map((r) => r.season))].sort(
    (a, b) => a - b,
  );
  const detail = [
    ranked.packs.length ? plural(ranked.packs.length, "pack") : "",
    ranked.episodes.length ? plural(ranked.episodes.length, "épisode") : "",
    ranked.films.length ? plural(ranked.films.length, "film") : "",
    seasons.length > 0 && seasons.length <= 3
      ? seasons.map((s) => `S${String(s).padStart(2, "0")}`).join(", ")
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return { total: ranked.total, headline, detail };
}

/** Décompte des releases de la page qui passent les filtres des réglages. */
export function tallyItems(items: NyaaItem[], filters: Filters, titles: string[] = []): Tally {
  return tally(rank(items, filters, titles), filters);
}
