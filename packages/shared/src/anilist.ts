/** AniList : retrouver l'anime et ses vrais titres. Appelé depuis le navigateur (IP de chacun, 30 req/min). */

export const ANILIST = "https://graphql.anilist.co";

export type Anime = {
  id: number;
  romaji: string;
  english: string | null;
  format: string | null; // TV, MOVIE, OVA…
  year: number | null;
  episodes: number | null;
  cover: string | null;
  popularity: number;
};

const FIELDS = "id title{romaji english} format seasonYear episodes popularity coverImage{large}";

type Raw = {
  id: number;
  title: { romaji: string; english: string | null };
  format: string | null;
  seasonYear: number | null;
  episodes: number | null;
  popularity: number | null;
  coverImage: { large: string | null } | null;
};

function toAnime(m: Raw): Anime {
  return {
    id: m.id,
    romaji: m.title.romaji,
    english: m.title.english,
    format: m.format,
    year: m.seasonYear,
    episodes: m.episodes,
    cover: m.coverImage?.large ?? null,
    popularity: m.popularity ?? 0,
  };
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<T> {
  const res = await fetchImpl(ANILIST, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) throw new Error("AniList limite les requêtes, réessaie dans une minute");
  if (!res.ok) throw new Error(`AniList ne répond pas (${res.status})`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

/** Les 5 meilleures correspondances ; la première est la plus populaire (« your name » → Kimi no Na wa, pas une pub). */
export async function findAnime(search: string, fetchImpl: typeof fetch = fetch): Promise<Anime[]> {
  const q = `query($s:String){Page(perPage:5){media(search:$s,type:ANIME,sort:SEARCH_MATCH){${FIELDS}}}}`;
  const data = await gql<{ Page: { media: Raw[] } }>(q, { s: search }, fetchImpl);
  return data.Page.media.map(toAnime).sort((a, b) => b.popularity - a.popularity);
}

export async function animeById(
  id: number,
  fetchImpl: typeof fetch = fetch,
): Promise<Anime | null> {
  const q = `query($id:Int){Media(id:$id,type:ANIME){${FIELDS}}}`;
  const data = await gql<{ Media: Raw | null }>(q, { id }, fetchImpl);
  return data.Media ? toAnime(data.Media) : null;
}

/** Titres à chercher sur Nyaa : le texte tapé, le romaji, l'anglais ; ponctuation retirée, alphabet latin seulement. */
export function titlesFor(query: string, anime: Anime | null): string[] {
  const out: string[] = [];
  for (const raw of [query, anime?.romaji, anime?.english]) {
    const name = (raw ?? "")
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name || [...name].some((ch) => ch.charCodeAt(0) > 0x24f)) continue;
    if (!out.some((o) => o.toLowerCase() === name.toLowerCase())) out.push(name);
  }
  return out;
}

export const FORMAT_LABEL: Record<string, string> = {
  TV: "Série TV",
  TV_SHORT: "Série courte",
  MOVIE: "Film",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "Spécial",
  MUSIC: "Clip",
};
