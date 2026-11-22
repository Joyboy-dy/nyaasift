/**
 * Avatars DiceBear, générés sur place (rien n'est envoyé à un service).
 * Style « Lorelei » (CC0 1.0) : un personnage en noir et blanc, lisible en 32 px,
 * sur un fond pastel doux qui varie d'une personne à l'autre (le jaune reste réservé à l'accent).
 */
import { Avatar, Style } from "@dicebear/core";
import lorelei from "@dicebear/styles/lorelei.json";

const style = new Style(lorelei);
const BACKGROUNDS = ["e8e4da", "d6dde3", "e3d9d2", "dfe3d4"];
const cache = new Map<string, string>();

/** `seed` : l'identifiant du compte, pour que l'avatar ne change pas avec le nom. */
export function avatarUri(seed: string): string {
  const hit = cache.get(seed);
  if (hit) return hit;
  const uri = new Avatar(style, { seed, backgroundColor: BACKGROUNDS }).toDataUri();
  cache.set(seed, uri);
  return uri;
}
