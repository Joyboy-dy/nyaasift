import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconMagnet,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import {
  FORMAT_LABEL,
  LANG_LABEL,
  animeById,
  findAnime,
  magnetOf,
  rank,
  searchParamsSchema,
  titlesFor,
  viewUrl,
  type Anime,
  type Filters,
  type NyaaItem,
  type Release,
} from "@nyaasift/shared";
import { AppFooter, TopBar, cx, errorText, formatDate } from "#/components/ui-bits";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { searchReleases } from "#/functions/search";

export const Route = createFileRoute("/_app/recherche")({
  validateSearch: searchParamsSchema,
  head: ({ match }) => ({ meta: [{ title: `${match.search.q || "Recherche"} · nyaasift` }] }),
  component: Results,
});

// `key` : la recherche à laquelle ce résultat répond ; s'il ne correspond pas, on est en train de charger
type Load =
  | { state: "loading"; key: string }
  | { state: "error"; key: string; problem: string }
  | { state: "done"; key: string; items: NyaaItem[]; fetchedAt: number; stale: boolean };

function Results() {
  const { viewer } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { q, anilist, raw, ...filters } = search;
  const fr = filters.lang !== "toutes";

  const [anime, setAnime] = useState<Anime | null>(null);
  const [candidates, setCandidates] = useState<Anime[]>([]);
  const [anilistDown, setAnilistDown] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const key = JSON.stringify([q, anilist ?? null, raw, fr]);
  const [result, setLoad] = useState<Load>({ state: "loading", key: "" });
  const load: Load = result.key === key ? result : { state: "loading", key };
  const [picking, setPicking] = useState(false);

  // 1. AniList dans le navigateur (IP et quota de chacun), 2. Nyaa par le serveur (garde-fous)
  useEffect(() => {
    let live = true;
    void (async () => {
      let found: Anime | null = null;
      let list: Anime[] = [];
      let down = false;
      if (!raw && q) {
        try {
          list = await findAnime(q);
          found = anilist
            ? (list.find((a) => a.id === anilist) ?? (await animeById(anilist)))
            : (list[0] ?? null);
        } catch {
          down = true;
        }
      }
      const t = titlesFor(q, found).slice(0, 4);
      if (!live) return;
      setAnime(found);
      setCandidates(list);
      setAnilistDown(down);
      setTitles(t);
      if (t.length === 0) {
        setLoad({ state: "error", key, problem: "Tape un titre pour chercher" });
        return;
      }
      try {
        const r = await searchReleases({ data: { titles: t, fr } });
        if (!live) return;
        setLoad(
          r.ok
            ? { state: "done", key, items: r.items, fetchedAt: r.fetchedAt, stale: r.stale }
            : { state: "error", key, problem: r.problem },
        );
      } catch (e) {
        if (live) setLoad({ state: "error", key, problem: errorText(e) });
      }
    })();
    return () => {
      live = false;
    };
  }, [q, anilist, raw, fr, key]);

  // dépend de `search` (stable entre deux rendus), pas de `filters` recréé à chaque rendu
  const ranked = useMemo(() => {
    if (result.key !== key || result.state !== "done") return null;
    const f: Filters = {
      lang: search.lang,
      res: search.res,
      season: search.season,
      type: search.type,
      minSeeders: search.minSeeders,
      all: search.all,
    };
    return rank(result.items, f, search.raw ? [] : titles, { movie: anime?.format === "MOVIE" });
  }, [result, key, search, titles, anime]);
  const setFilter = (patch: Partial<Filters>) =>
    void navigate({ search: (s) => ({ ...s, ...patch }), replace: true });

  return (
    <div className="page">
      <TopBar viewer={viewer} query={q} />
      <main className="wrap">
        <AnimeCard
          q={q}
          anime={anime}
          titles={titles}
          raw={raw}
          anilistDown={anilistDown}
          fr={fr}
          onPick={() => setPicking((p) => !p)}
        />
        {picking && (
          <Matches
            q={q}
            current={anime?.id ?? null}
            candidates={candidates}
            onChoose={(id) => {
              setPicking(false);
              void navigate({
                search: (s) => ({ ...s, anilist: id ?? undefined, raw: id === null }),
              });
            }}
            onClose={() => setPicking(false)}
          />
        )}
        <FilterBar
          filters={filters}
          raw={raw}
          setFilter={setFilter}
          onRaw={(v) => void navigate({ search: (s) => ({ ...s, raw: v, anilist: undefined }) })}
        />
        <ActiveChips filters={filters} setFilter={setFilter} />

        {load.state === "loading" && <Loading />}
        {load.state === "error" && (
          <div className="notice" role="alert" style={{ marginTop: 24 }}>
            <p style={{ margin: 0 }}>{load.problem}</p>
          </div>
        )}
        {load.state === "done" && ranked && (
          <>
            {load.stale && (
              <div className="notice" role="status" style={{ marginTop: 24 }}>
                <p style={{ margin: 0, flex: "1 1 480px" }}>
                  Nyaa ne répond pas pour l'instant.{" "}
                  <span className="text2">
                    Voici les derniers résultats connus, de{" "}
                    {new Date(load.fetchedAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ; les toutes dernières sorties peuvent manquer
                  </span>
                </p>
              </div>
            )}
            <p className="summary">
              <span>
                {filters.all
                  ? "Toutes les releases de chaque épisode"
                  : "Meilleure release de chaque épisode, choisie par seeders, remakes écartés"}
              </span>
              <span className="dim">
                {ranked.total} releases · résultats de{" "}
                {new Date(load.fetchedAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · cache 5 min
              </span>
            </p>
            {ranked.total === 0 ? (
              <p className="empty" style={{ marginTop: 24 }}>
                {load.items.length > 0
                  ? "Rien ne passe ces filtres. Retire un filtre pour voir les autres releases"
                  : "Nyaa n'a rien pour ces titres. Essaie un autre titre, ou la recherche brute"}
              </p>
            ) : (
              <>
                <Section title="Films" rows={ranked.films} />
                <Section title="Packs et saisons complètes" rows={ranked.packs} />
                <Episodes groups={ranked.episodes} all={filters.all} />
                {ranked.other.length > 0 && <Section title="Non classés" rows={ranked.other} />}
              </>
            )}
            <p className="legend">
              <span>
                <span className="dot fr" />
                Voix FR (VF ou MULTi)
              </span>
              <span>
                <span className="dot sub" />
                VOSTFR
              </span>
              <span>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: "rgb(76 195 138 / 18%)",
                  }}
                />
                Uploader de confiance
              </span>
              <span>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: "rgb(229 72 77 / 20%)",
                  }}
                />
                Remake
              </span>
            </p>
          </>
        )}
      </main>
      <AppFooter viewer={viewer} />
    </div>
  );
}

function AnimeCard(props: {
  q: string;
  anime: Anime | null;
  titles: string[];
  raw: boolean;
  anilistDown: boolean;
  fr: boolean;
  onPick: () => void;
}) {
  const { anime } = props;
  return (
    <section className="anime" aria-label="Anime reconnu">
      <div
        className="cover"
        role="img"
        aria-label={anime ? `Affiche de ${anime.romaji}` : "Pas d'affiche"}
      >
        {anime?.cover ? (
          <img src={anime.cover} alt="" />
        ) : (
          <>
            <b style={{ fontWeight: 500, fontSize: 15, lineHeight: "18px" }}>
              {anime?.romaji ?? props.q}
            </b>
            <small className="mono muted" style={{ fontSize: 11 }}>
              {props.raw ? "recherche brute" : "AniList"}
            </small>
          </>
        )}
      </div>
      <div className="anime-info">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          {props.raw
            ? "Recherche brute, sans AniList"
            : props.anilistDown
              ? "AniList ne répond pas, recherche brute"
              : anime
                ? "Anime reconnu"
                : "Aucun anime reconnu par AniList"}
        </p>
        <h1>{anime?.romaji ?? props.q}</h1>
        {anime && (
          <p className="text2" style={{ margin: 0, fontSize: 16, lineHeight: "24px" }}>
            {[
              anime.english,
              anime.format ? (FORMAT_LABEL[anime.format] ?? anime.format) : null,
              anime.year,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <p className="searched">
          Cherché sur Nyaa sous
          {props.titles.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
          {props.fr && <span className="tag">+ (multi|vf|french|vostfr…)</span>}
        </p>
      </div>
      {!props.raw && (
        <button type="button" className="btn" onClick={props.onPick}>
          Pas le bon anime ?
        </button>
      )}
    </section>
  );
}

function Matches(props: {
  q: string;
  current: number | null;
  candidates: Anime[];
  onChoose: (id: number | null) => void;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState<number | null>(props.current);
  return (
    <section
      aria-labelledby="pick"
      className="panel"
      style={{
        maxWidth: 760,
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        borderColor: "var(--ns-line2)",
      }}
    >
      <div>
        <h2 id="pick" style={{ margin: 0, fontSize: 20, lineHeight: "28px", fontWeight: 500 }}>
          Ce n'est pas le bon anime ?
        </h2>
        <p className="text2" style={{ margin: 0 }}>
          AniList trouve aussi ces titres pour « {props.q} ». Choisis le bon, on relance la
          recherche sur Nyaa avec ses noms
        </p>
      </div>
      <fieldset
        style={{
          margin: 0,
          padding: 0,
          border: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <legend className="sr-only">Correspondances AniList</legend>
        {props.candidates.length === 0 && <p className="muted">AniList n'a rien trouvé d'autre</p>}
        {props.candidates.map((a) => (
          <label
            key={a.id}
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              minHeight: 72,
              padding: "12px 16px",
              borderRadius: 10,
              cursor: "pointer",
              border: `1px solid ${choice === a.id ? "var(--ns-line2)" : "var(--ns-line)"}`,
              background: choice === a.id ? "var(--ns-raised)" : "var(--ns-bg)",
            }}
          >
            <input
              type="radio"
              name="match"
              checked={choice === a.id}
              onChange={() => setChoice(a.id)}
              style={{ accentColor: "var(--ns-accent)" }}
            />
            {a.cover ? (
              <img
                src={a.cover}
                alt=""
                width={40}
                height={56}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
            ) : null}
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{a.romaji}</span>
              <span className="mono muted" style={{ fontSize: 12 }}>
                {[
                  a.english,
                  a.format ? (FORMAT_LABEL[a.format] ?? a.format) : null,
                  a.year,
                  a.episodes ? `${a.episodes} ép.` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          className="btn primary"
          disabled={choice === null}
          onClick={() => props.onChoose(choice)}
        >
          Chercher avec cet anime
        </button>
        <button type="button" className="btn" onClick={props.onClose}>
          Annuler
        </button>
        <span style={{ flexGrow: 1 }} />
        <button type="button" className="link" onClick={() => props.onChoose(null)}>
          Chercher « {props.q} » tel quel, sans AniList
        </button>
      </div>
    </section>
  );
}

const LANGS: Filters["lang"][] = ["toutes", "fr", "multi", "vostfr"];
const SEASONS = [
  { value: "0", label: "Toutes" },
  ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Saison ${i + 1}` })),
];
const RES: Filters["res"][] = ["toutes", "2160p", "1080p", "720p"];
const TYPES: [Filters["type"], string][] = [
  ["tout", "Tout"],
  ["series", "Séries"],
  ["films", "Films"],
];

function FilterBar(props: {
  filters: Filters;
  raw: boolean;
  setFilter: (p: Partial<Filters>) => void;
  onRaw: (v: boolean) => void;
}) {
  const f = props.filters;
  return (
    <form className="panel filters" aria-label="Filtres" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="fg">
        <legend>Langue</legend>
        <div className="seg">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={f.lang === l}
              onClick={() => props.setFilter({ lang: l })}
            >
              {l === "fr" || l === "multi" ? (
                <span className="dot fr" />
              ) : l === "vostfr" ? (
                <span className="dot sub" />
              ) : null}
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="fg">
        <legend>Qualité</legend>
        <div className="seg">
          {RES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={f.res === r}
              onClick={() => props.setFilter({ res: r })}
            >
              {r === "toutes" ? "Toutes" : r}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="fg">
        <span id="season-label" className="fg-label">
          Saison
        </span>
        <Select
          items={SEASONS}
          value={String(f.season)}
          onValueChange={(v) => props.setFilter({ season: Number(v) })}
        >
          <SelectTrigger
            aria-labelledby="season-label"
            className={cx("ns-select", f.season > 0 && "on")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {SEASONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset className="fg">
        <legend>Type</legend>
        <div className="seg">
          {TYPES.map(([t, label]) => (
            <button
              key={t}
              type="button"
              aria-pressed={f.type === t}
              onClick={() => props.setFilter({ type: t })}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="fg">
        <label htmlFor="seeds">Seeders min.</label>
        <input
          id="seeds"
          className="field"
          type="number"
          min={0}
          value={f.minSeeders}
          style={{ width: 72 }}
          onChange={(e) =>
            props.setFilter({ minSeeders: Math.max(0, Number(e.target.value) || 0) })
          }
        />
      </div>
      <div className="checks">
        <label>
          <Checkbox checked={f.all} onCheckedChange={(v) => props.setFilter({ all: v })} />
          Toutes les releases de chaque épisode
        </label>
        <label>
          <Checkbox checked={props.raw} onCheckedChange={(v) => props.onRaw(v)} />
          Recherche brute, sans AniList
        </label>
      </div>
      <button
        type="button"
        className="link"
        style={{ marginLeft: "auto", alignSelf: "center" }}
        onClick={() =>
          props.setFilter({
            lang: "toutes",
            res: "toutes",
            season: 0,
            type: "tout",
            minSeeders: 1,
            all: false,
          })
        }
      >
        Réinitialiser
      </button>
    </form>
  );
}

function ActiveChips({
  filters: f,
  setFilter,
}: {
  filters: Filters;
  setFilter: (p: Partial<Filters>) => void;
}) {
  const chips: [string, Partial<Filters>, boolean][] = [
    [LANG_LABEL[f.lang], { lang: "toutes" }, f.lang !== "toutes"],
    [f.res, { res: "toutes" }, f.res !== "toutes"],
    [`Saison ${f.season}`, { season: 0 }, f.season > 0],
    [f.type === "films" ? "Films" : "Séries", { type: "tout" }, f.type !== "tout"],
  ];
  const active = chips.filter((c) => c[2]);
  if (active.length === 0) return null;
  return (
    <div
      className="muted"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        marginTop: 16,
        fontSize: 13,
      }}
    >
      Filtres actifs
      {active.map(([label, reset]) => (
        <button
          key={label}
          type="button"
          className="chip"
          aria-label={`Retirer le filtre ${label}`}
          onClick={() => setFilter(reset)}
        >
          {label}
          <IconX size={16} stroke={1.5} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <section className="sec" aria-busy="true">
      <h2>
        Recherche sur Nyaa <span className="count">…</span>
      </h2>
      <div className="tbl">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton" style={i === 0 ? { borderTop: 0 } : undefined} />
        ))}
      </div>
    </section>
  );
}

function Head() {
  return (
    <div className="row head" role="row">
      <span role="columnheader">Épisode</span>
      <span role="columnheader">Nom</span>
      <span role="columnheader">Langue</span>
      <span role="columnheader">Qualité</span>
      <span className="num" role="columnheader">
        Taille
      </span>
      <span role="columnheader">Date</span>
      <span className="num" role="columnheader" title="Seeders">
        S
      </span>
      <span className="num" role="columnheader" title="Leechers">
        L
      </span>
      <span className="num" role="columnheader">
        Liens
      </span>
    </div>
  );
}

function Row({ r, kind, more }: { r: Release; kind?: "open" | "other"; more?: React.ReactNode }) {
  const cls = ["row", "item", kind ?? "", r.remake ? "remake" : r.trusted ? "trusted" : ""].join(
    " ",
  );
  return (
    <div className={cls} role="row" id={`r-${r.id}`}>
      <span className="code" role="cell">
        {kind === "other" ? "autre" : r.code}
      </span>
      <span className="name" role="cell">
        <a href={viewUrl(r.id)} target="_blank" rel="noreferrer" title={r.title}>
          {r.title}
        </a>
        {more}
      </span>
      <span role="cell">
        <span className={cx("lang", r.lang === "Autre" && "autre")}>
          {r.lang === "VF" || r.lang === "MULTi" ? (
            <span className="dot fr" />
          ) : r.lang === "VOSTFR" ? (
            <span className="dot sub" />
          ) : null}
          {r.lang}
        </span>
      </span>
      <span className="dim" role="cell">
        {r.res ?? "—"}
      </span>
      <span className="num" role="cell">
        {r.size}
      </span>
      <span className="dim" role="cell">
        {formatDate(r.date)}
      </span>
      <span className="num seed" role="cell">
        {r.seeders}
      </span>
      <span className="num leech" role="cell">
        {r.leechers}
      </span>
      <span className="links" role="cell">
        <a href={viewUrl(r.id)} target="_blank" rel="noreferrer" aria-label="Ouvrir la page Nyaa">
          <IconExternalLink size={16} stroke={1.5} aria-hidden="true" />
        </a>
        <a href={magnetOf(r)} aria-label="Ouvrir le lien magnet">
          <IconMagnet size={16} stroke={1.5} aria-hidden="true" />
        </a>
      </span>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Release[] }) {
  return (
    <section className="sec">
      <h2>
        {title} <span className="count">{rows.length}</span>
      </h2>
      {rows.length === 0 ? (
        <p className="empty">Aucun résultat dans cette section avec ces filtres</p>
      ) : (
        <div className="tbl" role="table" aria-label={title}>
          <Head />
          {rows.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </div>
      )}
    </section>
  );
}

function Episodes({ groups, all }: { groups: ReturnType<typeof rank>["episodes"]; all: boolean }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  if (groups.length === 0) return <Section title="Épisodes" rows={[]} />;
  return (
    <section className="sec">
      <h2>
        Épisodes <span className="count">{groups.length}</span>
      </h2>
      <nav className="track" aria-label="Aller à un épisode">
        {groups.map((g) => (
          <a key={g.code} href={`#r-${g.best.id}`} title={g.code}>
            {g.code.slice(-3)}
          </a>
        ))}
      </nav>
      <div className="tbl" role="table" aria-label="Épisodes">
        <Head />
        {groups.map((g) => {
          const expanded = all || open.has(g.code);
          const toggle =
            !all && g.others.length > 0 ? (
              <button
                type="button"
                className="more"
                aria-expanded={expanded}
                onClick={() =>
                  setOpen((s) => {
                    const n = new Set(s);
                    if (n.has(g.code)) n.delete(g.code);
                    else n.add(g.code);
                    return n;
                  })
                }
              >
                {g.others.length} autre{g.others.length > 1 ? "s" : ""}
                {expanded ? (
                  <IconChevronUp size={16} stroke={1.5} aria-hidden="true" />
                ) : (
                  <IconChevronDown size={16} stroke={1.5} aria-hidden="true" />
                )}
              </button>
            ) : null;
          return (
            <div key={g.code} role="rowgroup">
              <Row
                r={g.best}
                kind={expanded && g.others.length > 0 ? "open" : undefined}
                more={toggle}
              />
              {expanded && g.others.map((o) => <Row key={o.id} r={o} kind="other" />)}
            </div>
          );
        })}
      </div>
    </section>
  );
}
