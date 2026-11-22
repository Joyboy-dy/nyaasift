/** Nyaa : adresses de recherche et lecture du flux RSS (sans DOM, utilisable partout). */

export const NYAA = "https://nyaa.si";

/** Une release telle que Nyaa la donne, avant analyse. */
export type NyaaItem = {
  id: number;
  title: string;
  size: string;
  date: string; // ISO
  seeders: number;
  leechers: number;
  infoHash: string;
  trusted: boolean;
  remake: boolean;
};

/** Mots ajoutés à une requête quand on veut du français : Nyaa comprend « a|b ». */
export const FR_QUERY = "(multi|vf|vff|french|truefrench|vostfr|subfrench)";

export function searchUrl(
  q: string,
  opts: { rss?: boolean; page?: number; category?: string } = {},
): string {
  const params = new URLSearchParams({ f: "0", c: opts.category ?? "1_0", q });
  if (opts.rss) params.set("page", "rss");
  else {
    params.set("s", "seeders");
    params.set("o", "desc");
    if (opts.page && opts.page > 1) params.set("p", String(opts.page));
  }
  return `${NYAA}/?${params.toString()}`;
}

export function viewUrl(id: number): string {
  return `${NYAA}/view/${id}`;
}

const TRACKERS = [
  "http://nyaa.tracker.wf:7777/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.opentrackr.org:1337/announce",
];

export function magnetOf(item: Pick<NyaaItem, "infoHash" | "title">): string {
  const tr = TRACKERS.map((t) => `&tr=${encodeURIComponent(t)}`).join("");
  return `magnet:?xt=urn:btih:${item.infoHash}&dn=${encodeURIComponent(item.title)}${tr}`;
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(block: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(block);
  return m?.[1] ? decode(m[1]) : "";
}

/** Lit le flux RSS de Nyaa. Le flux est régulier : une expression suffit, pas besoin d'un parseur XML. */
export function parseRss(xml: string): NyaaItem[] {
  const items: NyaaItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1] ?? "";
    const id = Number(/\/view\/(\d+)/.exec(tag(b, "guid"))?.[1]);
    if (!Number.isFinite(id)) continue;
    const pub = tag(b, "pubDate");
    items.push({
      id,
      title: tag(b, "title"),
      size: tag(b, "nyaa:size"),
      date: pub ? new Date(pub).toISOString() : "",
      seeders: Number(tag(b, "nyaa:seeders")) || 0,
      leechers: Number(tag(b, "nyaa:leechers")) || 0,
      infoHash: tag(b, "nyaa:infoHash"),
      trusted: tag(b, "nyaa:trusted") === "Yes",
      remake: tag(b, "nyaa:remake") === "Yes",
    });
  }
  return items;
}

/** Une page HTML de résultats Nyaa tient 75 lignes : au-delà, il y a une page suivante. */
export const NYAA_PAGE_SIZE = 75;
