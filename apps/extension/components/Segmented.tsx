import { LANG_LABEL, type Filters } from "@nyaasift/shared";

type Option<T extends string> = { value: T; label: string; dot?: "fill" | "ring" };

/** Point du repère voix FR : plein = VF ou MULTi, creux = VOSTFR. */
export function Dot({ kind }: { kind: "fill" | "ring" }) {
  return <span className={`dot dot-${kind}`} aria-hidden="true" />;
}

export const LANG_OPTIONS: Option<Filters["lang"]>[] = [
  { value: "toutes", label: LANG_LABEL.toutes },
  { value: "fr", label: LANG_LABEL.fr, dot: "fill" },
  { value: "multi", label: LANG_LABEL.multi, dot: "fill" },
  { value: "vostfr", label: LANG_LABEL.vostfr, dot: "ring" },
];

export const RES_OPTIONS: Option<Filters["res"]>[] = [
  { value: "toutes", label: "Toutes" },
  { value: "2160p", label: "2160p" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
];

export function langDot(lang: Filters["lang"]): "fill" | "ring" | undefined {
  return LANG_OPTIONS.find((o) => o.value === lang)?.dot;
}

export function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  stretch?: boolean;
}) {
  return (
    <div
      className={props.stretch ? "seg seg-stretch" : "seg"}
      role="group"
      aria-label={props.label}
    >
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === props.value}
          onClick={() => props.onChange(o.value)}
        >
          {o.dot && <Dot kind={o.dot} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
