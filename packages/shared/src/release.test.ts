import { describe, expect, test } from "bun:test";
import { codeOf, parseName, sizeBytes } from "./release";

// Vrais noms relevés sur nyaa.si le 2026-11-22, plus les cas du prototype Python.
const CASES: [string, string, number, number | null, string, string | null][] = [
  [
    "[ToonsHub] Saga of Tanya the Evil S02E11 1080p CR WEB-DL MULTi AAC2.0 H.264 (Youjo Senki, Multi-Audio, Multi-Subs)",
    "episode",
    2,
    11,
    "MULTi",
    "1080p",
  ],
  [
    "[ToonsHub] Saga of Tanya the Evil S02E11 1080p CR WEB-DL DUAL AAC2.0 H.264 (Youjo Senki, Dual-Audio, Multi-Subs)",
    "episode",
    2,
    11,
    "Autre",
    "1080p",
  ],
  [
    "Saga of Tanya the Evil S02E07 Purgatory 1080p CR WEB-DL MULTi AAC2.0 H.264-VARYG (Youjo Senki Movie, Multi-Audio, Multi-Subs)",
    "episode",
    2,
    7,
    "MULTi",
    "1080p",
  ],
  [
    "[T3KASHi] Saga of Tanya the Evil S02 MULTi 1080p CR WEBRiP AAC 2.0 x.265 (Youjo Senki II, VF, VOSTFR)",
    "pack",
    2,
    null,
    "MULTi",
    "1080p",
  ],
  [
    "Saga of Tanya the Evil S02E11 SUBFRENCH 1080p CR WEB-DL AAC2.0 x264-Tsundere-Raws (VOSTFR, Youjo Senki II, Saga of Tanya the Evil II)",
    "episode",
    2,
    11,
    "VOSTFR",
    "1080p",
  ],
  [
    "[ToonsHub] Saga of Tanya the Evil the Movie (2019) 1080p CR WEB-DL DUAL AAC2.0 H.264 (Youjo Senki Movie, Dual-Audio, Multi-Subs)",
    "film",
    1,
    null,
    "Autre",
    "1080p",
  ],
  [
    "[Judas] Youjo Senki (Saga of Tanya the Evil) - S02E11 [1080p][HEVC x265 10bit][Multi-Subs] (Weekly)",
    "episode",
    2,
    11,
    "Autre",
    "1080p",
  ],
  ["[SubsPlease] Youjo Senki II - 05 (720p) [ABCD1234]", "episode", 2, 5, "Autre", "720p"],
  ["[Tsundere-Raws] Youjo Senki - 01-12 VOSTFR 1080p", "pack", 1, 1, "VOSTFR", "1080p"],
  [
    "Sousou no Frieren S01-02 [Vostfr][CR WEB-Rip][1080p AV1 10-bit]",
    "pack",
    1,
    null,
    "VOSTFR",
    "1080p",
  ],
  ["Sousou.No.Frieren.S02.VOSTFR.1080p.WEBRiP.x265-KAF", "pack", 2, null, "VOSTFR", "1080p"],
  [
    "Frieren Beyond Journey's End S02E08 MULTi 1080p WEB x264 AAC -Tsundere-Raws (CR) (VF, FRENCH, VOSTFR, Sousou no Frieren 2nd Season)",
    "episode",
    2,
    8,
    "MULTi",
    "1080p",
  ],
  ["Youjo Senki E07 VOSTFR 720p", "episode", 1, 7, "VOSTFR", "720p"],
  ["[Group] Youjo Senki Movie (2019) VF 1080p", "film", 1, null, "VF", "1080p"],
];

describe("parseName", () => {
  for (const [title, kind, season, ep, lang, res] of CASES) {
    test(title.slice(0, 70), () => {
      const p = parseName(title);
      expect([p.kind, p.season, p.ep, p.lang, p.res]).toEqual([
        kind,
        season,
        ep,
        lang,
        res,
      ] as never);
    });
  }
});

test("codeOf écrit les codes façon timecode", () => {
  expect(codeOf(parseName("Show S02E11 1080p"))).toBe("S02 · E11");
  expect(codeOf(parseName("Show S02 MULTi 1080p"))).toBe("S02 · complet");
  expect(codeOf(parseName("Show - 01-12 VOSTFR"))).toBe("S01 · E01-12");
  expect(codeOf(parseName("Show Movie 1080p"))).toBe("Film");
});

test("sizeBytes convertit les tailles de Nyaa", () => {
  expect(sizeBytes("1.5 GiB")).toBe(1.5 * 2 ** 30);
  expect(sizeBytes("1012.3 MiB")).toBeCloseTo(1012.3 * 2 ** 20);
});
