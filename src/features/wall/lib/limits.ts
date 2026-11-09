/** Same bounds as the DB check (char_length(body) between 2 and 140). */
export const WALL_MIN = 2;
export const WALL_MAX = 140;

/** Length as Postgres char_length counts it (code points, so an emoji is 1, not 2). */
export function wallLength(text: string): number {
  return [...text.trim()].length;
}
