import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconLoader2,
  IconSearch,
} from "@tabler/icons-react";
import {
  FORMAT_LABEL,
  LANG_LABEL,
  rank,
  searchUrl,
  titlesFor,
  type Anime,
  type Filters,
  type NyaaItem,
} from "@nyaasift/shared";
import { browser } from "#imports";
import { Dot, LANG_OPTIONS, langDot, Segmented } from "@/components/Segmented";
import { filtersPhrase } from "@/lib/format";
import { lookupAnime, searchNyaa, type Lookup } from "@/lib/search";
import { defaultSettings, type Settings } from "@/lib/settings";
import { loadSettings, takePending, watchPending, watchSettings, type Origin } from "@/lib/storage";
import { Results } from "./Results";

type Search = { q: string; anilistId?: number; from?: Origin };

type Run =
  | { phase: "idle" }
  | { phase: "anime" }
  | { phase: "nyaa"; done: number; total: number }
  | { phase: "done"; items: NyaaItem[]; error: string | null };

export default function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [lang, setLang] = useState<Filters["lang"]>(defaultSettings.filters.lang);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState<Search | null>(null);
  const [look, setLook] = useState<Lookup | null>(null);
  const [matches, setMatches] = useState<Anime[]>([]);
  const [picking, setPicking] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [run, setRun] = useState<Run>({ phase: "idle" });
  const abort = useRef<AbortController | null>(null);

  const start = useCallback(async (s: Search, l: Filters["lang"]) => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setSearch(s);
    setInput(s.q);
    setPicking(false);
    setRun({ phase: "anime" });
    const found = await lookupAnime(s.q, s.anilistId);
    if (ctl.signal.aborted) return;
    if (!s.anilistId) setMatches(found.matches);
    // recherche vide de nyaa.si : le texte tapé ne donne rien, seuls les titres AniList comptent
    const t =
      s.from === "nyaa-empty" && found.anime
        ? titlesFor("", found.anime)
        : titlesFor(s.q, found.anime);
    setLook(found);
    setTitles(t);
    setRun({ phase: "nyaa", done: 0, total: 1 });
    const res = await searchNyaa(t, l, {
      signal: ctl.signal,
      onProgress: (done, total) => setRun({ phase: "nyaa", done, total }),
    });
    if (ctl.signal.aborted) return;
    setRun({ phase: "done", items: res.items, error: res.error });
  }, []);

  // réglages, puis recherche envoyée par nyaa.si, AniList ou MyAnimeList
  useEffect(() => {
    let current = defaultSettings;
    const openPending = () =>
      void takePending().then((p) => {
        if (p) void start(p, current.filters.lang);
      });
    void loadSettings().then((s) => {
      current = s;
      setSettings(s);
      setLang(s.filters.lang);
      openPending();
    });
    const stopPending = watchPending(openPending);
    const stopSettings = watchSettings((s) => {
      current = s;
      setSettings(s);
      setLang(s.filters.lang);
    });
    return () => {
      stopPending();
      stopSettings();
    };
  }, [start]);

  const filters: Filters = { ...settings.filters, lang };
  const items = run.phase === "done" ? run.items : null;
  const ranked = useMemo(
    () =>
      items
        ? rank(items, { ...settings.filters, lang }, titles, {
            movie: look?.anime?.format === "MOVIE",
          })
        : null,
    [items, settings.filters, lang, titles, look],
  );

  function changeLang(l: Filters["lang"]) {
    setLang(l);
    // les requêtes en français s'ajoutent ou s'en vont : on relance (AniList et Nyaa sont en cache)
    if (search) void start(search, l);
  }

  async function openPicker() {
    setPicking(!picking);
    // venu d'AniList : l'anime est connu par son numéro, les autres correspondances restent à chercher
    if (!picking && matches.length <= 1 && search) {
      const found = await lookupAnime(look?.anime?.romaji ?? search.q);
      setMatches(found.matches);
    }
  }

  const anime = look?.anime ?? null;
  const busy = run.phase === "anime" || run.phase === "nyaa";

  return (
    <div className="panel">
      <header className="top">
        <span className="brand">
          nyaa<span>sift</span>
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label="Réglages"
          title="Réglages"
          onClick={() => void browser.runtime.openOptionsPage()}
        >
          <IconAdjustmentsHorizontal size={16} stroke={1.5} />
        </button>
      </header>

      <main className="body">
        <form
          role="search"
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = input.trim();
            if (q) void start({ q }, lang);
          }}
        >
          <label htmlFor="q" className="sr">
            Titre de l'anime
          </label>
          <input
            id="q"
            type="search"
            autoFocus
            maxLength={200}
            placeholder="Titre de l'anime"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="go" aria-label="Chercher">
            <IconSearch size={16} stroke={1.5} />
          </button>
        </form>

        <Segmented
          label="Langue"
          value={lang}
          options={LANG_OPTIONS}
          onChange={changeLang}
          stretch
        />

        {search?.from === "nyaa-empty" && run.phase !== "anime" && (
          <div role="status" className="note">
            <span>Venu de nyaa.si : rien pour « {search.q} »</span>
            {anime && titles.length > 0 && (
              <span className="tags">
                Cherché sous
                {titles.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        {look?.anilistDown && (
          <p role="status" className="note">
            AniList ne répond pas : recherche sous le titre tapé seulement
          </p>
        )}
        {look && !look.anilistDown && !anime && run.phase !== "anime" && (
          <p role="status" className="note">
            AniList ne reconnaît pas ce titre : recherche sous le titre tapé
          </p>
        )}

        {anime && (
          <section aria-label="Anime reconnu" className="anime">
            {anime.cover ? (
              <img className="cover" src={anime.cover} alt={`Affiche de ${anime.romaji}`} />
            ) : (
              <div className="cover" role="img" aria-label={`Affiche de ${anime.romaji}`} />
            )}
            <div className="names">
              <span className="romaji">{anime.romaji}</span>
              {anime.english && anime.english !== anime.romaji && (
                <span className="sub">{anime.english}</span>
              )}
              {(lang !== "toutes" || filters.res !== "toutes") && (
                <span className="sub with-dot">
                  {langDot(lang) && <Dot kind={langDot(lang) ?? "fill"} />}
                  {[
                    lang === "toutes" ? "" : LANG_LABEL[lang],
                    filters.res === "toutes" ? "" : filters.res,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </div>
            <button
              type="button"
              className="link"
              aria-expanded={picking}
              onClick={() => void openPicker()}
            >
              changer
            </button>
          </section>
        )}

        {picking && (
          <div className="picker">
            {matches.length === 0 && <p className="sub">Aucune autre correspondance sur AniList</p>}
            {matches.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-current={m.id === anime?.id}
                onClick={() =>
                  search && void start({ q: search.q, anilistId: m.id, from: search.from }, lang)
                }
              >
                <span>{m.romaji}</span>
                <span className="sub">
                  {[m.format ? (FORMAT_LABEL[m.format] ?? m.format) : "", m.year ?? ""]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            ))}
          </div>
        )}

        {busy && (
          <p role="status" className="loading">
            <IconLoader2 className="spin" size={16} stroke={1.5} aria-hidden="true" />
            {run.phase === "anime"
              ? "Recherche de l'anime sur AniList"
              : `Recherche sur Nyaa · ${run.done + 1} sur ${run.total}`}
          </p>
        )}

        {run.phase === "done" && run.error && (
          <div role="alert" className="note error">
            <IconAlertTriangle size={16} stroke={1.5} aria-hidden="true" />
            <span>{run.error}</span>
            {search && (
              <button type="button" className="link" onClick={() => void start(search, lang)}>
                Réessayer
              </button>
            )}
          </div>
        )}

        {ranked && ranked.total > 0 && <Results ranked={ranked} all={settings.filters.all} />}

        {ranked && ranked.total === 0 && !(run.phase === "done" && run.error) && (
          <div className="empty" role="status">
            <strong>
              Aucune release{filtersPhrase(filters) ? ` ${filtersPhrase(filters)}` : ""}
            </strong>
            <span>
              {items && items.length > 0
                ? "Nyaa a des résultats, mais aucun ne passe tes filtres. Essaie une autre langue, ou une autre qualité dans les réglages."
                : `Nyaa n'a rien sous ${titles.map((t) => `« ${t} »`).join(", ") || "ce titre"}. Essaie un autre nom, ou change d'anime.`}
            </span>
          </div>
        )}
      </main>

      <footer className="foot">
        <span>Lu par ton navigateur, rien n'est envoyé ailleurs</span>
        {search && (
          <a href={searchUrl(titles[0] ?? search.q)} target="_blank" rel="noreferrer">
            Ouvrir dans nyaa.si
          </a>
        )}
      </footer>
    </div>
  );
}
