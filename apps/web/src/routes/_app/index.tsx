import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { LANG_LABEL, type Filters } from "@nyaasift/shared";
import { TopBar } from "#/components/ui-bits";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "nyaasift" }] }),
  component: Home,
});

const LANGS: Filters["lang"][] = ["toutes", "fr", "multi", "vostfr"];
const EXAMPLES = ["saga tanya", "frieren", "your name"];

function Home() {
  const { viewer } = Route.useRouteContext();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<Filters["lang"]>("fr");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar viewer={viewer} />
      <main
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 32px 128px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 40,
                lineHeight: "44px",
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              Tape le titre comme il te vient
            </h1>
            <p
              className="text2"
              style={{ margin: 0, maxWidth: "36rem", fontSize: 18, lineHeight: "28px" }}
            >
              On retrouve l'anime sous tous ses noms et on range Nyaa par film, pack et épisode, en
              VF, MULTi ou VOSTFR
            </p>
          </div>
          <form
            role="search"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) void navigate({ to: "/recherche", search: { q: q.trim(), lang } });
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <label htmlFor="q" className="sr-only">
                Titre de l'anime
              </label>
              <input
                id="q"
                className="input lg"
                type="search"
                placeholder="saga tanya"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ flexGrow: 1 }}
              />
              <button type="submit" className="btn primary lg">
                <IconSearch size={16} stroke={1.5} aria-hidden="true" />
                Chercher
              </button>
            </div>
            <fieldset
              style={{
                margin: 0,
                padding: 0,
                border: 0,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
              }}
            >
              <legend className="sr-only">Langue</legend>
              <span aria-hidden="true" className="muted" style={{ fontSize: 13 }}>
                Langue
              </span>
              <div className="seg lg">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={lang === l}
                    onClick={() => setLang(l)}
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
          </form>
          <p
            className="muted"
            style={{
              margin: 0,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            Essaie
            {EXAMPLES.map((ex) => (
              <Link
                key={ex}
                to="/recherche"
                search={{ q: ex, lang }}
                className="tag"
                style={{ textDecoration: "none" }}
              >
                {ex}
              </Link>
            ))}
          </p>
        </div>
      </main>
      <footer
        className="muted"
        style={{
          padding: "20px 32px",
          borderTop: "1px solid var(--ns-line)",
          fontSize: 13,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>nyaasift ne télécharge rien, il te donne les liens vers Nyaa</span>
        <span>Open source · aucun pistage · titres via AniList</span>
      </footer>
    </div>
  );
}
