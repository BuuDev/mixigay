import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapLiveStatus, type LiveStatusRow } from "../lib/mapper";
import * as mock from "../mock";
import type { LiveStatus } from "../types";

/** First paint only; the client keeps it current through Realtime (useLiveStatus). */
export async function getLiveStatus(): Promise<LiveStatus> {
  "use cache";
  cacheTag(TAGS.live);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.liveStatus;
  const row = check<LiveStatusRow>(await publicClient().from("live_status").select("*").single(), "live_status");
  return mapLiveStatus(row);
}
