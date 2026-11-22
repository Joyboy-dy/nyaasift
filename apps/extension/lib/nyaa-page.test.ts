import { describe, expect, test } from "bun:test";
import { defaultFilters } from "@nyaasift/shared";
import { readNyaaTable, tallyItems } from "./nyaa-page";

const page = await Bun.file(new URL("./fixtures/nyaa-search.html", import.meta.url)).text();

describe("readNyaaTable", () => {
  const items = readNyaaTable(page) ?? [];

  test("lit chaque ligne de la page enregistrée", () => {
    expect(items.map((i) => i.id)).toEqual([2187599, 2179814, 2179701, 2165308, 2165283]);
  });

  test("garde le titre de la release, pas le lien des commentaires", () => {
    expect(items[2]?.title).toStartWith("Saga of Tanya the Evil S02E11 MULTi AD 1080p");
    expect(items[2]?.id).toBe(2179701);
  });

  test("taille, date, seeders, leechers, hash", () => {
    expect(items[0]).toMatchObject({
      size: "1012.3 MiB",
      date: new Date(1795012763 * 1000).toISOString(),
      seeders: 18,
      leechers: 2,
      infoHash: "b0747357a7c1a686d307d44ad933ea781ccf291c",
      trusted: false,
      remake: false,
    });
  });

  test("confiance (success) et remake (danger)", () => {
    expect(items[3]).toMatchObject({ trusted: true, remake: false });
    expect(items[4]).toMatchObject({ trusted: false, remake: true });
  });

  test("page illisible : null plutôt qu'un compte faux", () => {
    expect(readNyaaTable("<div>rien</div>")).toBeNull();
    expect(readNyaaTable(page.replace(/data-timestamp="\d+"/, ""))).toBeNull();
  });
});

describe("tallyItems", () => {
  const items = readNyaaTable(page) ?? [];

  test("compte ce qui passe les filtres", () => {
    const t = tallyItems(items, { ...defaultFilters, lang: "fr", res: "1080p" });
    expect(t).toEqual({
      total: 3,
      headline: "3 releases en voix FR 1080p",
      detail: "1 pack · 1 épisode · S02",
    });
  });

  test("sans filtre de langue", () => {
    const t = tallyItems(items, defaultFilters);
    expect(t.headline).toBe("5 releases");
    expect(t.detail).toBe("1 pack · 2 épisodes · S02");
  });

  test("rien ne passe", () => {
    const t = tallyItems(items, { ...defaultFilters, lang: "vostfr" });
    expect(t).toEqual({ total: 0, headline: "Aucune release en VOSTFR", detail: "" });
  });
});
