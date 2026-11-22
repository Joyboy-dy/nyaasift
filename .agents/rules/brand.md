# Brand

nyaasift has no brandmark yet. Until it exists, screens use a neutral style. The brand is
created with the brandmark plugin, in `../nyaasift-brandmark/` next to this project.

## Contract with brandmark

- Colours: the colour roles in `brand.json` and the exports in `identity/color/`
  (`colors.css`, `colors.json`). Map them to the design tokens (`:root` and `.dark`);
  components only use semantic tokens, never raw colours.
- Fonts: the files and licences in `identity/typography/fonts/`.
- Logos and icons: the official files in `identity/logo/` and `applications/` (favicons, app
  icons). Copy them; never re-draw, re-type or recolour a logo by hand.

## Applying a brand that arrives later

It is an ordinary feature: tokens, fonts, favicons and the welcome page, checked in light and
dark themes. Keep the contrast of text, borders and focus rings at 3:1 or more.
