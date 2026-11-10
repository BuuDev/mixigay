/** Same bounds as the DB checks on glossary_entries (char_length). */
export const TERM_MIN = 2;
export const TERM_MAX = 60;
export const MEANING_MIN = 10;
export const MEANING_MAX = 300;
export const SOURCE_MAX = 300;

/** Length as Postgres char_length counts it (code points, so an emoji is 1, not 2). */
export function textLength(text: string): number {
  return [...text.trim()].length;
}
