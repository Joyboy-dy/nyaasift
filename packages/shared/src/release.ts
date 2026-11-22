/** Lecture d'un nom de release d'anime : épisode, saison, pack, film, qualité, langue. */

export type ReleaseKind = "film" | "pack" | "episode" | "autre";
export type Lang = "MULTi" | "VF" | "VOSTFR" | "Autre";
export type Resolution = "2160p" | "1080p" | "720p" | "576p" | "480p" | null;

export type ParsedName = {
  kind: ReleaseKind;
  season: number;
  ep: number | null;
  epEnd: number | null;
  res: Resolution;
  lang: Lang;
};

const ROMAN: Record<string, number> = { ii: 2, iii: 3, iv: 4 };

export function langOf(t: string): Lang {
  // « Multi-Subs » = sous-titres seulement, pas de piste audio française
  if (/\bmulti\b(?![-\s]?subs?)/.test(t)) return "MULTi";
  if (/\b(vf[fqi2]?|truefrench|french|fr)\b/.test(t)) return "VF";
  if (/\b(vostfr|subfrench)\b/.test(t)) return "VOSTFR";
  return "Autre";
}

export function resOf(t: string): Resolution {
  if (/\b(2160p|4k|uhd)\b/.test(t)) return "2160p";
  const m = /\b(1080|720|576|480)p\b/.exec(t);
  return m ? (`${m[1]}p` as Resolution) : null;
}

export function seasonOf(t: string): number {
  const m =
    /\bs(\d{1,2})(?=e\d|\b)/.exec(t) ??
    /\b(?:season|saison)\s*(\d{1,2})\b/.exec(t) ??
    /\b(\d{1,2})(?:st|nd|rd|th)\s+season\b/.exec(t);
  if (m?.[1]) return Number(m[1]);
  const r = /\b(ii|iii|iv)\b/.exec(t);
  return r?.[1] ? (ROMAN[r[1]] ?? 1) : 1;
}

export function parseName(title: string): ParsedName {
  const t = title.toLowerCase();
  const info: ParsedName = {
    kind: "autre",
    season: seasonOf(t),
    ep: null,
    epEnd: null,
    res: resOf(t),
    lang: langOf(t),
  };

  // retire ce qui ressemble à un numéro d'épisode sans en être : CRC, résolution, codecs, années, audio
  const c = t
    .replace(/\[[0-9a-f]{8}\]/g, " ")
    .replace(
      /\b(\d{3,4}p|[xh]\.?26[45]|10.?bits?|8.?bits?|(?:19|20)\d\d|\d\.\d|aac\d?\.?\d?|ddp?\d?\.?\d?)\b/g,
      " ",
    );

  const range =
    /\bs\d{1,2}e(\d{1,4})\s*[-~]\s*(?:s\d{1,2})?e?(\d{1,4})\b/.exec(c) ??
    /\b(?:e|ep|episodes?|épisodes?)?\s*(\d{2,4})\s*[-~à]\s*(?:e|ep)?(\d{2,4})\b/.exec(c);
  if (range?.[1] && range[2] && Number(range[2]) > Number(range[1])) {
    return { ...info, kind: "pack", ep: Number(range[1]), epEnd: Number(range[2]) };
  }

  // SxxEyy passe avant « movie » : certains uploaders écrivent « Youjo Senki Movie » sur des épisodes
  let m = /\bs\d{1,2}e(\d{1,4})\b/.exec(c);
  const film = /\b(movie|film|gekijouban)\b/.test(c);
  if (!m && !film)
    m =
      /\b(?:e|ep|episode|épisode)\s?(\d{1,4})(?:v\d)?\b/.exec(c) ??
      /\s[-–]\s(\d{1,4})(?:v\d)?\b/.exec(c);

  if (m?.[1]) return { ...info, kind: "episode", ep: Number(m[1]) };
  if (film) return { ...info, kind: "film" };
  if (
    /\b(batch|complete|complet|int[ée]grale|bd ?box)\b/.test(c) ||
    /\b(?:s\d{1,2}|season\s*\d+|saison\s*\d+)\b/.test(c)
  ) {
    return { ...info, kind: "pack" };
  }
  return info;
}

/** « 1.4 GiB » → octets, pour trier par taille. */
export function sizeBytes(size: string): number {
  const UNITS: Record<string, number> = {
    B: 1,
    KiB: 2 ** 10,
    MiB: 2 ** 20,
    GiB: 2 ** 30,
    TiB: 2 ** 40,
  };
  const [n, unit] = size.trim().split(/\s+/);
  return Number(n) * (UNITS[unit ?? "B"] ?? 1);
}

/** « S02 · E11 », « S02 · complet », « S02 · E01-12 », « Film », « ? » */
export function codeOf(p: ParsedName): string {
  const s = `S${String(p.season).padStart(2, "0")}`;
  const e = (n: number) => `E${String(n).padStart(2, "0")}`;
  if (p.kind === "episode" && p.ep !== null) return `${s} · ${e(p.ep)}`;
  if (p.kind === "pack")
    return p.ep !== null && p.epEnd !== null
      ? `${s} · ${e(p.ep)}-${String(p.epEnd).padStart(2, "0")}`
      : `${s} · complet`;
  if (p.kind === "film") return "Film";
  return "?";
}
