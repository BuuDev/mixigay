import "server-only";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/shared/lib/cache-tags";
import { becameLive, deriveLiveStatus, shouldPoll } from "../lib/live";
import { notifyLive } from "./notify";
import { mapOverrides, mapSlot } from "@/features/schedule/lib/mapper";
import type { LiveStatusRow } from "../lib/mapper";
import type { ScheduleOverrideRow, ScheduleSlotRow } from "@/features/schedule/lib/mapper";
import { fetchRssVideoIds } from "@/server/youtube/client";
import { loadClassifier } from "@/features/videos/server/classifier";
import type { JobContext } from "@/server/jobs/context";
import { toVideoColumns } from "@/features/videos/lib/video-row";

export interface PollLiveResult {
  skipped?: "sparse";
  checked?: number;
  state?: string;
  videoId?: string;
  notified?: string[];
}

/** One poll of the channel's live state. See docs/02-architecture.md, flow 1. */
export async function pollLive({ db, yt, channelId }: JobContext, now: Date, opts: { force?: boolean } = {}): Promise<PollLiveResult> {
  // Overrides from yesterday (Vietnam time can be a day ahead of UTC) onwards.
  const since = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  const [statusRes, slotsRes, overridesRes] = await Promise.all([
    db.from("live_status").select("*").single(),
    db.from("schedule_slots").select("*").eq("active", true),
    db.from("schedule_overrides").select("*").gte("date_vn", since),
  ]);
  if (statusRes.error) throw new Error(`live_status: ${statusRes.error.message}`);
  const prev = statusRes.data as LiveStatusRow;
  const schedule = ((slotsRes.data ?? []) as ScheduleSlotRow[]).map(mapSlot);
  const overrides = mapOverrides((overridesRes.data ?? []) as ScheduleOverrideRow[]);

  if (!opts.force && !shouldPoll({ now, state: prev.state, lastCheckedAt: prev.checked_at ?? undefined, schedule, overrides })) {
    return { skipped: "sparse" };
  }

  // Candidates: what we already think is live/upcoming plus the RSS feed (free), never search.list.
  const [activeRes, rssIds] = await Promise.all([db.from("videos").select("video_id").in("live_state", ["upcoming", "live"]), fetchRssVideoIds(channelId)]);
  const activeIds = ((activeRes.data ?? []) as { video_id: string }[]).map((r) => r.video_id);
  const ids = [...new Set([...activeIds, ...rssIds])].slice(0, 50);
  const items = ids.length ? await yt.videos(ids) : [];

  if (items.length) {
    const existingRes = await db
      .from("videos")
      .select("video_id, playlist_ids")
      .in(
        "video_id",
        items.map((v) => v.id),
      );
    const playlists = new Map(((existingRes.data ?? []) as { video_id: string; playlist_ids: string[] }[]).map((r) => [r.video_id, r.playlist_ids]));
    const classify = await loadClassifier(db);
    const rows = items.map((v) => {
      const cols = toVideoColumns(v, now);
      return { ...cols, auto_game_slug: classify({ title: cols.title, playlistIds: playlists.get(v.id) }) };
    });
    const up = await db.from("videos").upsert(rows, { onConflict: "video_id" });
    if (up.error) throw new Error(`videos upsert: ${up.error.message}`);

    const samples = rows
      .filter((r) => r.live_state === "live")
      .map((r) => ({
        video_id: r.video_id,
        sampled_at: new Date(Math.floor(now.getTime() / 60_000) * 60_000).toISOString(),
        concurrent_viewers: Number(items.find((v) => v.id === r.video_id)?.liveStreamingDetails?.concurrentViewers ?? 0),
      }));
    if (samples.length) await db.from("live_samples").upsert(samples, { onConflict: "video_id,sampled_at", ignoreDuplicates: true });
  }

  // Streams we tracked as active that YouTube no longer returns were deleted or made private.
  const returned = new Set(items.map((v) => v.id));
  const vanished = activeIds.filter((id) => !returned.has(id));
  if (vanished.length) await db.from("videos").update({ live_state: "none" }).in("video_id", vanished);

  const next = deriveLiveStatus(items, now);
  const upd = await db
    .from("live_status")
    .update({
      state: next.state,
      video_id: next.videoId ?? null,
      title: next.title ?? null,
      start_time: next.startTime ?? null,
      concurrent_viewers: next.concurrentViewers ?? null,
      checked_at: now.toISOString(),
    })
    .eq("id", true);
  if (upd.error) throw new Error(`live_status update: ${upd.error.message}`);

  const changed = prev.state !== next.state || (prev.video_id ?? undefined) !== next.videoId;
  if (changed) {
    revalidateTag(TAGS.live, "max");
    revalidateTag(TAGS.videos, "max");
    // A stream just started or ended: /thong-ke shows it without waiting for the hourly cache.
    revalidateTag(TAGS.stats, "max");
  }

  let notified: string[] = [];
  if (becameLive(prev.state, next, prev.video_id ?? undefined) && next.videoId) {
    notified = await notifyLive(db, { videoId: next.videoId, title: next.title ?? "" });
  }
  return { checked: items.length, state: next.state, videoId: next.videoId, notified };
}
