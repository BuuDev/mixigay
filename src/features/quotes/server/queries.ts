import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getVideos } from "@/features/videos/server/queries";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapQuotes, QUOTE_SELECT, type QuoteRow } from "../lib/mapper";
import * as mock from "../mock";
import type { Quote, QuoteVideoOption } from "../types";

/** Approved quotes, newest first (RLS hides pending ones from the anon client). */
export async function getQuotes(): Promise<Quote[]> {
  "use cache";
  cacheTag(TAGS.quotes);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.quotes;
  const rows = check<QuoteRow[]>(
    await publicClient().from("quotes").select(QUOTE_SELECT).eq("approved", true).order("created_at", { ascending: false }).limit(120),
    "quotes",
  );
  return mapQuotes(rows);
}

/** The viewer's own quotes waiting for review (RLS lets authors read them). Dynamic (session): render under <Suspense>, never cache. */
export async function getMyPendingQuotes(userId: string): Promise<Quote[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  const { data } = await supabase
    .from("quotes")
    .select(QUOTE_SELECT)
    .eq("author_id", userId)
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(5);
  return mapQuotes((data ?? []) as unknown as QuoteRow[]);
}

/** Recent videos of the channel for the form's picker (small payload: id, title, length). */
export async function getQuoteVideoOptions(limit = 40): Promise<QuoteVideoOption[]> {
  const videos = await getVideos();
  return videos.slice(0, limit).map((v) => ({
    videoId: v.videoId,
    title: v.title,
    durationSeconds: v.durationMinutes > 0 ? (v.durationMinutes + 1) * 60 : undefined,
  }));
}

/** Upper bound of a timestamp for a known video (one minute of slack: lengths are stored in whole minutes). */
export async function quoteMaxSecondsLookup(): Promise<(videoId: string) => number | undefined> {
  const byId = new Map((await getVideos()).map((v) => [v.videoId, v.durationMinutes]));
  return (id) => {
    const minutes = byId.get(id);
    return minutes && minutes > 0 ? (minutes + 1) * 60 : undefined;
  };
}
