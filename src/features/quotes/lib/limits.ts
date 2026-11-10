/** Same bounds as the DB check (char_length(body) between 5 and 200, at_seconds between 0 and 86400). */
export const QUOTE_MIN = 5;
export const QUOTE_MAX = 200;
export const QUOTE_MAX_SECONDS = 86400;

/** Length as Postgres char_length counts it (code points, so an emoji is 1, not 2). */
export function quoteLength(text: string): number {
  return [...text.trim()].length;
}
