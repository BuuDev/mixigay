import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapLiveStatus, type LiveStatusRow } from "../lib/mapper";
import * as mock from "../mock";
import type { LiveStatus } from "../types";

async function loadLiveStatus(): Promise<LiveStatus> {
  if (!isSupabaseConfigured) return mock.liveStatus;
  const db = publicClient();
  const [statusRes, nextRes] = await Promise.all([db.from("live_status").select("*").single(), db.rpc("live_next_check_at")]);
  const row = check<LiveStatusRow>(statusRes, "live_status");
  return mapLiveStatus(row, typeof nextRes.data === "string" ? nextRes.data : null);
}

/**
 * For pages (the root layout reads it, so every page carries the `live` tag). poll-live
 * refreshes `live` only when the visible state changed, so pages are not regenerated after
 * every check. Its nextCheckAt can therefore be old; useLiveStatus then reads /api/live
 * shortly after the page loads and follows the fresh plan from there.
 */
export async function getLiveStatus(): Promise<LiveStatus> {
  "use cache";
  cacheTag(TAGS.live);
  cacheLife("days"); // only its tag refreshes it (poll-live, on a visible change)
  return loadLiveStatus();
}

/**
 * For /api/live only: same data, also tagged `live-timer`, which poll-live refreshes after
 * every check ({ expire: 30 }), so tabs that wake at nextCheckAt get the new plan, not the old one.
 */
export async function getLiveFeed(): Promise<LiveStatus> {
  "use cache";
  cacheTag(TAGS.live, TAGS.liveTimer);
  cacheLife("hours");
  return loadLiveStatus();
}
