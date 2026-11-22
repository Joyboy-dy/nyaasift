import { useEffect, useState, type ReactNode } from "react";
import { LANG_OPTIONS, RES_OPTIONS, Segmented } from "@/components/Segmented";
import { defaultSettings, type Settings } from "@/lib/settings";
import { loadSettings, saveSettings, watchSettings } from "@/lib/storage";

type Flag = "nyaaBar" | "rescue" | "siteButton";

function Setting(props: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="setting">
      <div className="txt">
        <strong>{props.title}</strong>
        <span>{props.text}</span>
      </div>
      {props.children}
    </div>
  );
}

function Switch(props: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      className="sw"
      aria-checked={props.on}
      aria-label={props.label}
      onClick={() => props.onChange(!props.on)}
    />
  );
}

const FLAGS: { key: Flag; title: string; text: string }[] = [
  {
    key: "nyaaBar",
    title: "Barre nyaasift sur nyaa.si",
    text: "Sous la recherche de Nyaa, sans toucher au reste de la page",
  },
  {
    key: "rescue",
    title: "Rattraper les recherches vides avec AniList",
    text: "Quand Nyaa ne trouve rien, chercher sous les vrais titres de l'anime",
  },
  {
    key: "siteButton",
    title: "Bouton sur AniList et MyAnimeList",
    text: "« Chercher sur Nyaa » sous le titre de chaque fiche",
  },
];

export default function App() {
  const [s, setS] = useState<Settings>(defaultSettings);

  useEffect(() => {
    void loadSettings().then(setS);
    return watchSettings(setS);
  }, []);

  function update(next: Settings) {
    setS(next);
    void saveSettings(next);
  }

  return (
    <div className="page">
      <header className="head">
        <p className="kicker">
          nyaa<span>sift</span> · extension
        </p>
        <h1>Réglages</h1>
      </header>

      <section>
        <h2>Ce que tu cherches d'habitude</h2>
        <div className="card">
          <Setting
            title="Langue par défaut"
            text="Appliquée à chaque recherche, modifiable sur la page"
          >
            <Segmented
              label="Langue par défaut"
              value={s.filters.lang}
              options={LANG_OPTIONS}
              onChange={(lang) => update({ ...s, filters: { ...s.filters, lang } })}
            />
          </Setting>
          <Setting
            title="Qualité préférée"
            text="Les autres restent visibles en retirant le filtre"
          >
            <Segmented
              label="Qualité préférée"
              value={s.filters.res}
              options={RES_OPTIONS}
              onChange={(res) => update({ ...s, filters: { ...s.filters, res } })}
            />
          </Setting>
        </div>
      </section>

      <section>
        <h2>Où l'extension agit</h2>
        <div className="card">
          {FLAGS.map((f) => (
            <Setting key={f.key} title={f.title} text={f.text}>
              <Switch
                label={f.title}
                on={s[f.key]}
                onChange={(on) => update({ ...s, [f.key]: on })}
              />
            </Setting>
          ))}
          <Setting
            title="Toutes les releases de chaque épisode"
            text="Par défaut, la meilleure release, les autres dépliables"
          >
            <Switch
              label="Toutes les releases de chaque épisode"
              on={s.filters.all}
              onChange={(all) => update({ ...s, filters: { ...s.filters, all } })}
            />
          </Setting>
        </div>
      </section>

      <p className="foot">
        L'extension parle seulement à nyaa.si et à AniList, depuis ton navigateur. Aucune
        statistique, aucun compte
      </p>
    </div>
  );
}
