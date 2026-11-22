# shadcn/ui — cursors, focus and visual micro-adjustments

## Files

- `apps/web/src/styles.css` — canonical shadcn/ui base only: theme, tokens and the
  official cursor baseline (`button:not(:disabled)`, `[role="button"]:not(:disabled)`), as
  written by `shadcn init --pointer`. Never mix project extensions in it.
- `apps/web/src/styles/customs.css` — every project extension (focus indicator, extra
  cursors, motion), imported from `styles.css`, headed "not part of shadcn/ui spec".
- Components are added with the shadcn CLI, then adapted to the brand. After `shadcn add`,
  check the imports (`@/lib/utils`, the project's icon library) and translate any visible or
  screen-reader label into the UI language.

## Cursor policy

- Official shadcn/ui baseline = buttons and `[role="button"]` only. Anything else (native
  checkbox, radio, select, file; ARIA tab, menuitem, option, switch; Select, Dropdown, Command,
  Slider, Resizable…) is a house convention, written in `customs.css`.
- Disabled: rely on each component's native mechanism (`disabled:cursor-not-allowed`,
  `data-disabled:cursor-not-allowed`, `pointer-events: none`). Never force
  `pointer-events: auto` on a natively disabled control.
- Match ARIA and data disabled states on the explicit value `"true"`
  (`:not([aria-disabled="true"])`, `:not([data-disabled="true"])`): some libraries (cmdk) set
  `data-disabled="false"` on active items.
- When those components are installed: Slider track `ew-resize`/`ns-resize`, thumb
  `grab`/`grabbing`; Resizable handle `col-resize`/`row-resize`.

## data-slot contracts

- Never write a selector on a `data-slot` without reading it in the installed
  `components/ui/*.tsx`. Never guess slot names.
- Never build a check or a selector on utility class names; use structural contracts:
  `data-slot`, `role`, ARIA or data state.
- When one slot serves several roles (e.g. `dialog-close` for the corner cross and a footer
  button), scope by structure: `[data-slot="dialog-content"] > [data-slot="dialog-close"]`.
- Visual fixes for a third-party preset go in `customs.css` with a comment naming the preset,
  never in `components/ui/`.
- `scripts/check-ui-cursor-contracts.mjs` (`bun run check:ui`, part of `bun run check`) fails
  when a `data-slot` used in CSS no longer exists in `components/ui/`. Any new extension ships
  together with a passing run of this check.

## Focus

- One global `:focus-visible` outline (2 px, `--ring`, offset 2 px) in `customs.css`.
- `--ring` and `--input` keep a contrast of 3:1 or more against the background (WCAG 1.4.11).
