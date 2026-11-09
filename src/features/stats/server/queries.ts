import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapSample, mapStreamMeta, type LiveSampleRow, type StreamMetaRow } from "../lib/mapper";
import { buildStreamStats } from "../lib/summary";
import * as mock from "../mock";
import type { StreamStats } from "../types";

/** How far back the page looks, counted from the newest sample (not the clock, so the read stays deterministic). */
const WINDOW_DAYS = 90;
const PAGE = 1000;
/** Safety cap: 90 days stays well under this (≈ 30 days at 1/min + 60 days at 1/5 min while live). */
const MAX_PAGES = 60;

/** Stream statistics from `live_samples` (written by poll-live) and `videos`. */
export async function getStreamStats(): Promise<StreamStats> {
  "use cache";
  cacheTag(TAGS.stats);
  cacheLife("hours");
  if (!isSupabaseConfigured) return buildStreamStats(mock.samples, mock.metas, { windowDays: mock.MOCK_WINDOW_DAYS });

  const db = publicClient();
  const latest = check<{ sampled_at: string }[]>(
    await db.from("live_samples").select("sampled_at").order("sampled_at", { ascending: false }).limit(1),
    "live_samples latest",
  );
  if (!latest.length) return buildStreamStats([], [], { windowDays: WINDOW_DAYS });
  const since = new Date(Date.parse(latest[0].sampled_at) - WINDOW_DAYS * 86_400_000).toISOString();

  // PostgREST caps a response at 1000 rows, so page through, newest first so the cap would only drop the oldest.
  const rows: LiveSampleRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE;
    const batch = check<LiveSampleRow[]>(
      await db
        .from("live_samples")
        .select("video_id,sampled_at,concurrent_viewers")
        .gte("sampled_at", since)
        .order("sampled_at", { ascending: false })
        .order("video_id")
        .range(from, from + PAGE - 1),
      "live_samples",
    );
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }

  const ids = [...new Set(rows.map((r) => r.video_id))];
  const metaRows: StreamMetaRow[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    metaRows.push(
      ...check<StreamMetaRow[]>(
        await db
          .from("videos")
          .select("video_id,title,actual_start_at,actual_end_at")
          .in("video_id", ids.slice(i, i + 100)),
        "videos",
      ),
    );
  }

  return buildStreamStats(rows.map(mapSample), metaRows.map(mapStreamMeta), { windowDays: WINDOW_DAYS });
}
