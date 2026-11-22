/** Rangement : films, packs, épisodes dans l'ordre (meilleure release + autres), non classés. */
import type { Filters } from "./filters";
import type { NyaaItem } from "./nyaa";
import { codeOf, parseName, type ParsedName } from "./release";

export type Release = NyaaItem & ParsedName & { code: string };

export type EpisodeGroup = {
  code: string;
  season: number;
  ep: number;
  best: Release;
  others: Release[];
};

export type Ranked = {
  films: Release[];
  packs: Release[];
  episodes: EpisodeGroup[];
  other: Release[];
  total: number; // releases gardées par les filtres
};

export function toRelease(item: NyaaItem): Release {
  const p = parseName(item.title);
  return { ...item, ...p, code: codeOf(p) };
}

/** Mots du titre : sert à écarter ce que Nyaa renvoie par erreur (il est laxiste). */
export function words(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** Garde une release si elle contient tous les mots d'au moins un des titres cherchés. */
export function matchesAnyTitle(title: string, titles: string[]): boolean {
  if (titles.length === 0) return true;
  const have = new Set(words(title));
  return titles.some((t) => words(t).every((w) => have.has(w)));
}

export function keep(r: Release, f: Filters): boolean {
  if (f.lang === "fr" && r.lang !== "VF" && r.lang !== "MULTi") return false;
  if (f.lang === "multi" && r.lang !== "MULTi") return false;
  if (f.lang === "vostfr" && r.lang !== "VOSTFR") return false;
  if (f.res !== "toutes" && r.res !== f.res) return false;
  if (f.season > 0 && r.kind !== "film" && r.season !== f.season) return false;
  if (f.type === "films" && r.kind !== "film") return false;
  if (f.type === "series" && r.kind === "film") return false;
  return r.seeders >= f.minSeeders;
}

/** Meilleure release d'abord : pas de remake, puis confiance, puis seeders. */
function better(a: Release, b: Release): number {
  if (a.remake !== b.remake) return a.remake ? 1 : -1;
  if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
  return b.seeders - a.seeders;
}

/**
 * `movie` : AniList dit que l'anime est un film. Les releases sans numéro d'épisode
 * (« Kimi no Na wa 1080p », sans le mot « movie ») sont alors rangées dans Films.
 */
export function rank(
  items: NyaaItem[],
  filters: Filters,
  titles: string[] = [],
  opts: { movie?: boolean } = {},
): Ranked {
  const seen = new Set<number>();
  const releases = items
    .filter((i) => !seen.has(i.id) && seen.add(i.id) && matchesAnyTitle(i.title, titles))
    .map(toRelease)
    .map((r) =>
      opts.movie && r.kind === "autre" ? { ...r, kind: "film" as const, code: "Film" } : r,
    )
    .filter((r) => keep(r, filters));

  const groups = new Map<string, Release[]>();
  for (const r of releases.filter((r) => r.kind === "episode")) {
    const key = r.code;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const episodes = [...groups.values()]
    .map((list) => {
      const sorted = [...list].sort(better);
      const best = sorted[0] as Release;
      return {
        code: best.code,
        season: best.season,
        ep: best.ep ?? 0,
        best,
        others: sorted.slice(1),
      };
    })
    .sort((a, b) => a.season - b.season || a.ep - b.ep);

  return {
    films: releases.filter((r) => r.kind === "film").sort(better),
    packs: releases
      .filter((r) => r.kind === "pack")
      .sort((a, b) => a.season - b.season || (a.ep ?? 0) - (b.ep ?? 0) || better(a, b)),
    episodes,
    other: releases.filter((r) => r.kind === "autre").sort(better),
    total: releases.length,
  };
}
