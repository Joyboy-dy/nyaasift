import { useState, type ReactNode } from "react";
import { IconExternalLink, IconMagnet } from "@tabler/icons-react";
import { magnetOf, viewUrl, type EpisodeGroup, type Ranked, type Release } from "@nyaasift/shared";
import { releaseLine, shortDate } from "@/lib/format";

/** Code affiché : « S02 » pour une saison complète, comme sur la maquette. */
function codeLabel(r: Release): string {
  return r.kind === "pack" && r.ep === null ? `S${String(r.season).padStart(2, "0")}` : r.code;
}

function Row({ r, dim }: { r: Release; dim?: boolean }) {
  // classes assemblées par join : le plugin Prettier de Tailwind retire les espaces des littéraux
  const cls = ["item", r.remake ? "remake" : r.trusted ? "trusted" : "", dim ? "other" : ""];
  return (
    <div className={cls.filter(Boolean).join(" ")}>
      <a
        className="main"
        href={magnetOf(r)}
        title={r.title}
        aria-label={`Lien magnet : ${r.title}`}
      >
        <span className="code">{codeLabel(r)}</span>
        <span className="grp">{releaseLine(r) || r.title}</span>
        <span className="meta">
          <span>{r.size}</span>
          <span className="seed">{r.seeders} S</span>
          <span>{shortDate(r.date)}</span>
        </span>
        <span className="ic" aria-hidden="true">
          <IconMagnet size={16} stroke={1.5} />
        </span>
      </a>
      <a
        className="ic view"
        href={viewUrl(r.id)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Page Nyaa : ${r.title}`}
        title="Page Nyaa"
      >
        <IconExternalLink size={16} stroke={1.5} />
      </a>
    </div>
  );
}

function Episode({ g, all }: { g: EpisodeGroup; all: boolean }) {
  const [open, setOpen] = useState(all);
  const n = g.others.length;
  return (
    <>
      <Row r={g.best} />
      {n > 0 && (
        <button type="button" className="more" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Masquer" : n === 1 ? "1 autre" : `${n} autres`}
        </button>
      )}
      {open && g.others.map((r) => <Row key={r.id} r={r} dim />)}
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <h2 className="h">
        {title} <span className="count">{count}</span>
      </h2>
      <div className="list">{children}</div>
    </section>
  );
}

export function Results({ ranked, all }: { ranked: Ranked; all: boolean }) {
  return (
    <div>
      <Section title="Packs" count={ranked.packs.length}>
        {ranked.packs.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </Section>
      <Section title="Épisodes" count={ranked.episodes.length}>
        {ranked.episodes.map((g) => (
          <Episode key={`${g.code}-${all}`} g={g} all={all} />
        ))}
      </Section>
      <Section title="Films" count={ranked.films.length}>
        {ranked.films.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </Section>
      <Section title="Non classés" count={ranked.other.length}>
        {ranked.other.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </Section>
      <p className="hint">Un clic ouvre le lien magnet · la flèche ouvre la page Nyaa</p>
    </div>
  );
}
