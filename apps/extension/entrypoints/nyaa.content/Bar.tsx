import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { rank, titlesFor, type Anime, type Filters, type NyaaItem } from "@nyaasift/shared";
import { Dot, langDot } from "@/components/Segmented";
import { tally, tallyItems, type Tally } from "@/lib/nyaa-page";
import { lookupAnime, searchNyaa } from "@/lib/search";
import { requestPanel } from "@/lib/storage";

type Props = { q: string; filters: Filters; items: NyaaItem[] | null; onClose: () => void };

type Rescue =
  | { state: "loading" }
  | { state: "done"; anime: Anime; titles: string[]; tally: Tally; error: string | null }
  | { state: "none" };

/** « 13 releases en voix FR 1080p », le nombre en chiffres mono. */
function Count({ t, filters, suffix }: { t: Tally; filters: Filters; suffix: string }) {
  const dot = langDot(filters.lang);
  const n = String(t.total);
  return (
    <span className="count">
      {dot && <Dot kind={dot} />}
      <span>
        {t.total > 0 ? (
          <>
            <span className="mono">{n}</span>
            {t.headline.slice(n.length)}
          </>
        ) : (
          t.headline
        )}
        {suffix}
      </span>
    </span>
  );
}

function Close({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="x"
      aria-label="Masquer la barre sur cette page"
      onClick={onClose}
    >
      <IconX size={16} stroke={1.5} />
    </button>
  );
}

/** Nyaa a des résultats : la barre compte ce qui est déjà sur la page, sans requête en plus. */
function PageBar({ q, filters, items, onClose }: Props & { items: NyaaItem[] }) {
  const t = tallyItems(items, filters);
  return (
    <div className="nsbar" role="region" aria-label="nyaasift">
      <span className="brand">
        nyaa<span>sift</span>
      </span>
      <Count t={t} filters={filters} suffix=" sur cette page" />
      {t.detail && <span className="detail">{t.detail}</span>}
      <span className="grow" />
      <button type="button" className="go" onClick={() => void requestPanel({ q, from: "nyaa" })}>
        Ranger dans le panneau
      </button>
      <Close onClose={onClose} />
    </div>
  );
}

/** Nyaa ne trouve rien : AniList, puis Nyaa sous les vrais titres de l'anime. */
function RescueBar({ q, filters, onClose }: Props) {
  const [r, setR] = useState<Rescue>({ state: "loading" });

  useEffect(() => {
    let live = true;
    void (async () => {
      const { anime } = await lookupAnime(q);
      if (!anime) {
        if (live) setR({ state: "none" });
        return;
      }
      const titles = titlesFor("", anime);
      const res = await searchNyaa(titles, filters.lang);
      const t = tally(
        rank(res.items, filters, titles, { movie: anime.format === "MOVIE" }),
        filters,
      );
      if (live) setR({ state: "done", anime, titles, tally: t, error: res.error });
    })();
    return () => {
      live = false;
    };
  }, [q, filters]);

  // AniList ne reconnaît rien non plus : la barre n'a rien d'utile à dire
  if (r.state === "none") return null;
  return (
    <div className="nsbar top" role="region" aria-label="nyaasift">
      <span className="brand">
        nyaa<span>sift</span>
      </span>
      <div className="stack">
        <span>Nyaa ne trouve rien pour « {q} »</span>
        {r.state === "loading" ? (
          <span className="sub" role="status">
            Recherche sous les vrais titres de l'anime
          </span>
        ) : (
          <>
            <span className="sub">
              AniList reconnaît <span className="hi">{r.anime.romaji}</span> · cherché sous
              {r.titles.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </span>
            {r.error && r.tally.total === 0 ? (
              <span className="sub" role="alert">
                {r.error}
              </span>
            ) : (
              <Count
                t={r.tally}
                filters={filters}
                suffix={r.tally.detail ? ` · ${r.tally.detail}` : ""}
              />
            )}
          </>
        )}
      </div>
      <button
        type="button"
        className="go"
        onClick={() => void requestPanel({ q, from: "nyaa-empty" })}
      >
        Ouvrir dans le panneau
      </button>
      <Close onClose={onClose} />
    </div>
  );
}

export function Bar(props: Props) {
  return props.items ? <PageBar {...props} items={props.items} /> : <RescueBar {...props} />;
}
