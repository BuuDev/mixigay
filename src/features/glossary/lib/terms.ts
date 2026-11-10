import { normalizeName } from "@/shared/lib/text";

/**
 * Comparison keys for a term: the whole term plus each "·"-separated alias,
 * without diacritics, case, quotes or spaces ("Lươn Cao Bằng · “Hí anh em”" → luoncaobang, hianhem…).
 */
export function termKeys(term: string): string[] {
  const keys = [term, ...term.split("·")].map(normalizeName).filter(Boolean);
  return [...new Set(keys)];
}

/** Fan entries whose term does not clash with a curated one (curated wins on duplicates). */
export function withoutCuratedTerms<T extends { term: string }>(entries: T[], curatedTerms: string[]): T[] {
  const taken = new Set(curatedTerms.flatMap(termKeys));
  return entries.filter((e) => !termKeys(e.term).some((k) => taken.has(k)));
}
