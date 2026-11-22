/** Settings of the icon scripts (bun run icons:generate / icons:migrate). */

/** Brand marks whose official colours must be kept (e.g. "google.svg" for the multicolour "G"). */
export const PRESERVE_ORIGINAL_COLORS = new Set<string>();

/** Hand-written components in components/icons that must never be deleted (e.g. "LogoIcon.tsx"). */
export const PROTECTED_CUSTOM_ICONS = new Set<string>();

/** SVG files of public/icons that are not icons. */
export const IGNORED_ICON_SOURCES = new Set(["favicon.svg"]);
