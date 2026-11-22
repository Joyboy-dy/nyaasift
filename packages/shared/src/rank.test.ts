import { expect, test } from "bun:test";
import { defaultFilters, filtersSchema } from "./filters";
import { parseRss, type NyaaItem } from "./nyaa";
import { matchesAnyTitle, rank } from "./rank";

const item = (
  id: number,
  title: string,
  seeders: number,
  extra: Partial<NyaaItem> = {},
): NyaaItem => ({
  id,
  title,
  size: "1.4 GiB",
  date: "2026-10-07T00:00:00.000Z",
  seeders,
  leechers: 0,
  infoHash: "abc",
  trusted: false,
  remake: false,
  ...extra,
});

const ITEMS = [
  item(
    1,
    "Saga of Tanya the Evil S02E11 Hourglass 1080p CR WEB-DL MULTi AAC2.0 H.264-VARYG (Youjo Senki II, Multi-Audio, Multi-Subs)",
    61,
  ),
  item(
    2,
    "[ToonsHub] Saga of Tanya the Evil S02E11 1080p CR WEB-DL MULTi AAC2.0 H.264 (Youjo Senki, Multi-Audio, Multi-Subs)",
    17,
  ),
  item(
    3,
    "[Judas] Youjo Senki (Saga of Tanya the Evil) - S02E11 [1080p][HEVC x265 10bit][Multi-Subs] (Weekly)",
    112,
    { remake: true },
  ),
  item(
    4,
    "Saga of Tanya the Evil S02E01 MULTi AD 1080p CR WEB-DL AAC2.0 x264-Tsundere-Raws (VF, FRENCH)",
    39,
  ),
  item(
    5,
    "[T3KASHi] Saga of Tanya the Evil S02 MULTi 1080p CR WEBRiP AAC 2.0 x.265 (Youjo Senki II, VF, VOSTFR)",
    33,
  ),
  item(
    6,
    "[ToonsHub] Saga of Tanya the Evil the Movie (2019) 1080p CR WEB-DL DUAL AAC2.0 H.264 (Youjo Senki Movie)",
    40,
  ),
  item(7, "Ride Your Wave Movie 2019 1080p", 13),
];

test("rangement : épisodes dans l'ordre, meilleure release sans remake, packs et films à part", () => {
  const r = rank(ITEMS, defaultFilters, ["Saga of Tanya the Evil"]);
  expect(r.episodes.map((e) => e.code)).toEqual(["S02 · E01", "S02 · E11"]);
  expect(r.episodes[1]?.best.id).toBe(1); // 61 seeders gagne, le remake de Judas passe après
  expect(r.episodes[1]?.others.map((o) => o.id)).toEqual([2, 3]);
  expect(r.packs.map((p) => p.id)).toEqual([5]);
  expect(r.films.map((f) => f.id)).toEqual([6]);
  expect(r.total).toBe(6); // « Ride Your Wave » écarté : ne contient pas les mots du titre
});

test("filtre voix FR : MULTi et VF gardés, le reste écarté", () => {
  const f = filtersSchema.parse({ lang: "fr" });
  const r = rank(ITEMS, f, ["Saga of Tanya the Evil"]);
  expect(r.films).toEqual([]);
  expect(
    r.episodes
      .flatMap((e) => [e.best, ...e.others])
      .every((x) => x.lang === "MULTi" || x.lang === "VF"),
  ).toBe(true);
});

test("les filtres invalides retombent sur leur valeur par défaut", () => {
  expect(filtersSchema.parse({ lang: "klingon", season: "abc", all: "false" })).toEqual(
    defaultFilters,
  );
});

test("matchesAnyTitle exige tous les mots d'un des titres", () => {
  expect(matchesAnyTitle("Sousou.No.Frieren.S02.VOSTFR", ["Sousou no Frieren"])).toBe(true);
  expect(
    matchesAnyTitle("Frieren Beyond Journey's End S02E09", ["Frieren Beyond Journey s End"]),
  ).toBe(true);
  expect(matchesAnyTitle("Ride Your Wave", ["your name"])).toBe(false);
});

test("parseRss lit un élément du flux de Nyaa", () => {
  const xml = `<rss xmlns:nyaa="https://nyaa.si/xmlns/nyaa"><channel><item>
    <title>[T3KASHi] Saga of Tanya the Evil S02 MULTi 1080p &amp; co</title>
    <link>https://nyaa.si/download/2179814.torrent</link>
    <guid isPermaLink="true">https://nyaa.si/view/2179814</guid>
    <pubDate>Wed, 28 Oct 2026 14:39:23 -0000</pubDate>
    <nyaa:seeders>33</nyaa:seeders><nyaa:leechers>1</nyaa:leechers>
    <nyaa:infoHash>b0747357a7c1a686d307d44ad933ea781ccf291c</nyaa:infoHash>
    <nyaa:size>3.7 GiB</nyaa:size><nyaa:trusted>No</nyaa:trusted><nyaa:remake>No</nyaa:remake>
  </item></channel></rss>`;
  const [i] = parseRss(xml);
  expect(i).toMatchObject({
    id: 2179814,
    title: "[T3KASHi] Saga of Tanya the Evil S02 MULTi 1080p & co",
    seeders: 33,
    leechers: 1,
    size: "3.7 GiB",
    trusted: false,
  });
  expect(i?.date.startsWith("2026-10-28")).toBe(true);
});
