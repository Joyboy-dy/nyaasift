/** Petits textes d'affichage communs au panneau et à la barre. */
import type { Filters, Release } from "@nyaasift/shared";

/** Groupe de la release : « [Groupe] Titre… » ou « Titre… x264-Groupe (…) ». */
export function groupOf(title: string): string {
  const lead = /^\s*\[([^\]]+)\]/.exec(title);
  if (lead?.[1]) return lead[1].trim();
  const last =
    title
      .replace(/\s*[([].*$/, "")
      .trim()
      .split(/\s+/)
      .pop() ?? "";
  // un chiffre avant le tiret (x264-, H.264-) : « WEB-DL » n'est pas un groupe
  return /^[^-]*\d[^-]*-([A-Za-z][\w.-]*)$/.exec(last)?.[1] ?? "";
}

/** « Tsundere-Raws · MULTi · 1080p » */
export function releaseLine(r: Release): string {
  return [groupOf(r.title), r.lang === "Autre" ? "" : r.lang, r.res ?? ""]
    .filter(Boolean)
    .join(" · ");
}

/** « 21/03/26 » */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${p(d.getFullYear() % 100)}`;
}

const LANG_PHRASE: Record<Filters["lang"], string> = {
  toutes: "",
  fr: "en voix FR",
  multi: "en MULTi",
  vostfr: "en VOSTFR",
};

/** « en voix FR 1080p », « en 720p », « » */
export function filtersPhrase(f: Pick<Filters, "lang" | "res">): string {
  const res = f.res === "toutes" ? "" : f.res;
  return [LANG_PHRASE[f.lang] || (res ? "en" : ""), res].filter(Boolean).join(" ");
}

/** plural(3, "épisode") → « 3 épisodes » */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}
