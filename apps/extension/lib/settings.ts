/** Réglages de l'extension (storage.sync) : filtres par défaut et endroits où l'extension agit. */
import { defaultFilters, filtersSchema, type Filters } from "@nyaasift/shared";

export type Settings = {
  filters: Filters;
  nyaaBar: boolean; // barre sur les pages de recherche de nyaa.si
  rescue: boolean; // rattraper les recherches vides de Nyaa avec AniList
  siteButton: boolean; // bouton « Chercher sur Nyaa » sur AniList et MyAnimeList
};

export const defaultSettings: Settings = {
  filters: defaultFilters,
  nyaaBar: true,
  rescue: true,
  siteButton: true,
};

function flag(raw: Record<string, unknown>, key: keyof Settings): boolean {
  const v = raw[key];
  return typeof v === "boolean" ? v : (defaultSettings[key] as boolean);
}

/** Valide ce qui sort du stockage : une valeur abîmée ou absente reprend sa valeur par défaut. */
export function parseSettings(raw: unknown): Settings {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    filters: filtersSchema.parse(obj.filters && typeof obj.filters === "object" ? obj.filters : {}),
    nyaaBar: flag(obj, "nyaaBar"),
    rescue: flag(obj, "rescue"),
    siteButton: flag(obj, "siteButton"),
  };
}
