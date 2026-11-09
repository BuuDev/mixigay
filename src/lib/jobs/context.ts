import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "../supabase/admin";
import { YouTubeClient } from "../youtube/client";

/** Daily units after which jobs stop calling YouTube (hard limit is 10,000). */
export const QUOTA_STOP = 8000;

export class JobConfigError extends Error {}
export class QuotaExceededError extends Error {}

export interface JobContext {
  db: SupabaseClient;
  yt: YouTubeClient;
  channelId: string;
}

export function jobContext(): JobContext {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) throw new JobConfigError("YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID not set");
  let db: SupabaseClient;
  try {
    db = adminClient();
  } catch (e) {
    throw new JobConfigError((e as Error).message);
  }
  // Records each call before it is made and refuses once the day's total passes QUOTA_STOP.
  const yt = new YouTubeClient(apiKey, async (endpoint, units) => {
    const { data, error } = await db.rpc("add_api_usage", { p_endpoint: endpoint, p_units: units });
    if (error) throw new Error(`api_usage: ${error.message}`);
    if ((data as number) > QUOTA_STOP) throw new QuotaExceededError(`YouTube quota guard: ${data} units used today`);
  });
  return { db, yt, channelId };
}
