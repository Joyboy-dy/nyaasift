import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { FR_QUERY } from "@nyaasift/shared";
import { z } from "zod";
import { auth, authReady } from "#/server/auth";
import { NyaaUnavailable, searchNyaa, takeSearchToken } from "#/server/nyaa";

/** Releases brutes de Nyaa pour ces titres ; le rangement et les filtres se font dans le navigateur. */
export const searchReleases = createServerFn({ method: "POST" })
  .validator(
    z.object({
      titles: z.array(z.string().trim().min(1).max(120)).min(1).max(4),
      fr: z.boolean(), // ajoute les requêtes « titre (multi|vf|…) »
    }),
  )
  .handler(async ({ data }) => {
    await authReady;
    const s = await auth.api.getSession({ headers: getRequestHeaders() });
    if (!s) throw new Error("Connecte-toi pour chercher");
    const wait = takeSearchToken(s.user.id);
    if (wait > 0)
      return {
        ok: false as const,
        problem: `Beaucoup de recherches d'un coup, réessaie dans ${wait} s`,
      };
    // Une seule requête Nyaa pour tous les titres : ("titre 1"|"titre 2") ; Nyaa comprend les phrases et le « ou ».
    // Filtre français : on ajoute (multi|vf|…), les autres releases seraient écartées de toute façon.
    const [first] = data.titles;
    const titles =
      data.titles.length > 1 ? `(${data.titles.map((t) => `"${t}"`).join("|")})` : (first ?? "");
    const queries = [data.fr ? `${titles} ${FR_QUERY}` : titles];
    try {
      const r = await searchNyaa(queries);
      return { ok: true as const, ...r };
    } catch (e) {
      if (e instanceof NyaaUnavailable) return { ok: false as const, problem: e.message };
      return {
        ok: false as const,
        problem: "Nyaa ne répond pas pour l'instant, réessaie dans un moment",
      };
    }
  });
