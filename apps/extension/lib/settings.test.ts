import { describe, expect, test } from "bun:test";
import { defaultFilters } from "@nyaasift/shared";
import { groupOf, filtersPhrase } from "./format";
import { defaultSettings, parseSettings } from "./settings";

describe("parseSettings", () => {
  test("rien d'enregistré : valeurs par défaut", () => {
    expect(parseSettings(undefined)).toEqual(defaultSettings);
    expect(parseSettings("abîmé")).toEqual(defaultSettings);
  });

  test("garde ce qui est valide, remplace le reste", () => {
    const s = parseSettings({
      filters: { lang: "fr", res: "4k", all: "true" },
      nyaaBar: false,
      rescue: "non",
    });
    expect(s.filters).toEqual({ ...defaultFilters, lang: "fr" });
    expect(s.nyaaBar).toBe(false);
    expect(s.rescue).toBe(true);
    expect(s.siteButton).toBe(true);
  });
});

describe("format", () => {
  test("groupe de la release", () => {
    expect(groupOf("[Erai-raws] Youjo Senki II - 12 [1080p]")).toBe("Erai-raws");
    expect(groupOf("Saga of Tanya S02E11 MULTi 1080p WEB-DL x264-Tsundere-Raws (VF)")).toBe(
      "Tsundere-Raws",
    );
    expect(groupOf("Show S01E01 1080p WEB H.264-VARYG")).toBe("VARYG");
    expect(groupOf("Show S01E01 1080p WEB-DL")).toBe("");
  });

  test("filtres en toutes lettres", () => {
    expect(filtersPhrase({ lang: "fr", res: "1080p" })).toBe("en voix FR 1080p");
    expect(filtersPhrase({ lang: "toutes", res: "720p" })).toBe("en 720p");
    expect(filtersPhrase({ lang: "toutes", res: "toutes" })).toBe("");
  });
});
