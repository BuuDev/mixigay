import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getFanArt } from "@/features/fan-art/server/queries";
import { getFanSongs } from "@/features/music/server/queries";
import { getQuizLinks } from "@/features/quiz/server/queries";
import { getQuotes } from "@/features/quotes/server/queries";
import { getSuggestions } from "@/features/suggestions/server/queries";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import type { ContributeCounts, CountedKind } from "../lib/contribute";

const SOURCE: Record<CountedKind, { table: string; tag: string }> = {
  suggestions: { table: "suggestions", tag: TAGS.suggestions },
  songs: { table: "fan_songs", tag: TAGS.songs },
  quiz: { table: "quiz_links", tag: TAGS.quiz },
  fanArt: { table: "fan_art", tag: TAGS.fanArt },
  quotes: { table: "quotes", tag: TAGS.quotes },
};

/**
 * Head count (no rows transferred) of what the public sees for one kind. RLS already
 * hides pending/hidden rows from the anon client; the filters say it explicitly.
 * A failed count degrades to `null` (a hint on the tile) instead of breaking the home page.
 */
async function publicCount(kind: CountedKind): Promise<number | null> {
  "use cache";
  const { table, tag } = SOURCE[kind];
  cacheTag(tag);
  cacheLife("minutes");
  const base = publicClient().from(table).select("id", { count: "exact", head: true });
  const { count, error } = await (kind === "suggestions" ? base.eq("hidden", false) : base.eq("approved", true));
  if (error) {
    console.error(`contribute count ${table}: ${error.message}`);
    return null;
  }
  return count ?? 0;
}

/** Approved items per contribution kind for the home "Góp sức cùng Bộ Tộc" tiles. `demo` = counted from mock data. */
export async function getContributeCounts(): Promise<{ counts: ContributeCounts; demo: boolean }> {
  if (!isSupabaseConfigured) {
    // Mock mode: count what the pages themselves show (each getter returns its mock list).
    const [suggestions, songs, quiz, fanArt, quotes] = await Promise.all([getSuggestions(), getFanSongs(), getQuizLinks(), getFanArt(), getQuotes()]);
    return {
      counts: { suggestions: suggestions.length, songs: songs.length, quiz: quiz.length, fanArt: fanArt.length, quotes: quotes.length },
      demo: true,
    };
  }
  const kinds = Object.keys(SOURCE) as CountedKind[];
  const values = await Promise.all(kinds.map(publicCount));
  return { counts: Object.fromEntries(kinds.map((k, i) => [k, values[i]])) as ContributeCounts, demo: false };
}
