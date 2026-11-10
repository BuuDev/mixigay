import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tonightLineup, type LineupPick } from "@/features/suggestions/lib/ranking";
import { getSuggestions } from "@/features/suggestions/server/queries";
import { TAGS } from "@/shared/lib/cache-tags";

export interface TonightLineupData {
  picks: LineupPick[];
  /** The clock the ranking used (ms). The board ranks with the same value so server and client agree. */
  rankedAt: number;
}

/**
 * "Ứng viên tối nay": the 5 candidates for tonight's game, ranked against the time the
 * cache entry was filled (hot scores decay, so the entry lives only minutes). Safe in a
 * prerendered shell: the clock is read inside "use cache".
 */
export async function getTonightLineup(): Promise<TonightLineupData> {
  "use cache";
  cacheTag(TAGS.suggestions);
  cacheLife("minutes");
  const suggestions = await getSuggestions();
  const rankedAt = Date.now();
  return { picks: tonightLineup(suggestions, rankedAt), rankedAt };
}
