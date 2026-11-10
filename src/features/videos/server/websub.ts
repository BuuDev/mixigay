import "server-only";
import { revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TAGS } from "@/shared/lib/cache-tags";
import { SITE_URL } from "@/shared/lib/links";
import type { JobContext } from "@/server/jobs/context";
import { isLocalUrl, subscribeForm, WEBSUB_HUB, WEBSUB_LEASE_SECONDS, WEBSUB_MAX_IDS } from "../lib/websub";
import { upsertYtVideos } from "./upsert";

// YouTube WebSub: the hub pushes an Atom notification when the channel publishes or
// updates a video. We fetch those ids with one videos.list call (1 unit for ≤ 50 ids)
// and upsert them like poll-live does. A live/upcoming video also wakes poll-live's timer,
// so an unscheduled stream is picked up on the next minute; poll-live still owns live_status.
// See docs/02-architecture.md flow 3 and docs/04-integrations.md "WebSub".

export const WEBSUB_CALLBACK_PATH = "/api/webhooks/youtube";

export interface WebSubConfig {
  secret: string;
  channelId: string;
}

/** WEBSUB_SECRET + YOUTUBE_CHANNEL_ID, or null when either is missing (routes answer 503). */
export function websubConfig(): WebSubConfig | null {
  const secret = process.env.WEBSUB_SECRET;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  return secret && channelId ? { secret, channelId } : null;
}

export class BodyTooLargeError extends Error {}

/** Reads the request body once, refusing to buffer more than `limit` bytes. */
export async function readBodyLimited(request: Request, limit: number): Promise<Buffer> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > limit) throw new BodyTooLargeError(`body ${declared} > ${limit}`);
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new BodyTooLargeError(`body > ${limit}`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/** Fetches and upserts the notified videos. 1 YouTube unit (ids are capped at 50 by parseFeed). */
export async function ingestVideos({ db, yt }: JobContext, ids: string[], now: Date = new Date()): Promise<{ fetched: number; woke?: boolean }> {
  const batch = [...new Set(ids)].slice(0, WEBSUB_MAX_IDS);
  if (!batch.length) return { fetched: 0 };
  const items = await yt.videos(batch);
  const fetched = await upsertYtVideos(db, items, now);
  if (fetched) revalidateTag(TAGS.videos, "max");
  // Wake poll-live for the next pg_cron tick instead of its timer (ADR-018/019) when a stream
  // is live or newly scheduled (often outside any slot), or when the stream we show as live
  // was updated: that is usually its end, long before the 4-hour end-of-shift check.
  const liveRes = await db.from("live_status").select("state, video_id").maybeSingle();
  const shownLive = (liveRes.data as { state: string; video_id: string | null } | null)?.state === "live" ? liveRes.data?.video_id : null;
  const woke = items.some((v) => v.snippet.liveBroadcastContent === "live" || v.snippet.liveBroadcastContent === "upcoming" || v.id === shownLive);
  if (woke) {
    const wake = await db.from("live_poll_state").update({ next_check_at: now.toISOString(), reason: "websub" }).eq("id", true);
    if (wake.error) console.warn(`websub: could not wake poll-live: ${wake.error.message}`);
  }
  return { fetched, woke };
}

/**
 * Deleted / privated videos. Rows are kept (sync-videos never removes them either); like
 * poll-live does for streams that vanish, an upcoming/live row is reset to live_state 'none'
 * so the live banner does not keep pointing at it.
 */
export async function markDeleted(db: SupabaseClient, ids: string[]): Promise<{ reset: number }> {
  if (!ids.length) return { reset: 0 };
  const { data, error } = await db.from("videos").update({ live_state: "none" }).in("video_id", ids).in("live_state", ["upcoming", "live"]).select("video_id");
  if (error) throw new Error(`videos update: ${error.message}`);
  const reset = data?.length ?? 0;
  console.info(`websub: ${ids.length} deleted entr${ids.length === 1 ? "y" : "ies"} (${ids.join(",")}), ${reset} live/upcoming row(s) reset; rows kept`);
  if (reset) revalidateTag(TAGS.videos, "max");
  return { reset };
}

export type RenewResult =
  { skipped: "localhost" | "not-configured" } | { ok: boolean; status: number; callback: string; leaseSeconds: number; requestedAt: string; error?: string };

/**
 * (Re)subscribes the channel topic at the hub. Verification is async: the hub then calls
 * GET /api/webhooks/youtube with hub.challenge. Re-subscribing daily just restarts the
 * 10-day lease, so no lease bookkeeping is needed. Costs no YouTube quota.
 */
export async function renewSubscription(now: Date): Promise<RenewResult> {
  const config = websubConfig();
  if (!config) return { skipped: "not-configured" };
  if (isLocalUrl(SITE_URL)) return { skipped: "localhost" };
  const callback = `${SITE_URL}${WEBSUB_CALLBACK_PATH}`;
  const res = await fetch(WEBSUB_HUB, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: subscribeForm({ channelId: config.channelId, callback, secret: config.secret }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = { ok: res.ok, status: res.status, callback, leaseSeconds: WEBSUB_LEASE_SECONDS, requestedAt: now.toISOString() };
  if (!res.ok) return { ...result, error: (await res.text()).slice(0, 300) };
  return result;
}
