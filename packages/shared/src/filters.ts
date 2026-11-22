import { z } from "zod";

/** Filtres de recherche : dans l'adresse du site, et dans les réglages de l'extension. */
export const langFilter = z.enum(["toutes", "fr", "multi", "vostfr"]);
export const resFilter = z.enum(["toutes", "2160p", "1080p", "720p"]);
export const typeFilter = z.enum(["tout", "series", "films"]);

export const filtersSchema = z.object({
  lang: langFilter.catch("toutes"),
  res: resFilter.catch("toutes"),
  season: z.coerce.number().int().min(0).max(99).catch(0), // 0 = toutes
  type: typeFilter.catch("tout"),
  minSeeders: z.coerce.number().int().min(0).max(100000).catch(1),
  // z.boolean et pas z.coerce.boolean : « false » en texte deviendrait true
  all: z.boolean().catch(false), // toutes les releases de chaque épisode
});
export type Filters = z.infer<typeof filtersSchema>;
export const defaultFilters: Filters = filtersSchema.parse({});

/** Paramètres de l'adresse /recherche. */
export const searchParamsSchema = filtersSchema.extend({
  q: z.string().trim().max(200).catch(""),
  anilist: z.coerce.number().int().positive().optional().catch(undefined), // anime choisi à la main
  raw: z.boolean().catch(false), // recherche brute, sans AniList
});
export type SearchParams = z.infer<typeof searchParamsSchema>;

export const LANG_LABEL: Record<z.infer<typeof langFilter>, string> = {
  toutes: "Toutes",
  fr: "Voix FR",
  multi: "MULTi",
  vostfr: "VOSTFR",
};
