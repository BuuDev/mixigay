import "server-only";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/shared/lib/cache-tags";
import { becameLive, deriveLiveStatus, nextCheckAt } from "../lib/live";
import { notifyLive } from "./notify";
import { mapOverrides, mapSlot } from "@/features/schedule/lib/mapper";
import type { LiveStatusRow } from "../lib/mapper";
import type { ScheduleOverrideRow, ScheduleSlotRow } from "@/features/schedule/lib/mapper";
import { fetchRssVideoIds } from "@/server/youtube/client";
import { loadClassifier } from "@/features/videos/server/classifier";
import type { JobContext } from "@/server/jobs/context";
import { toVideoColumns } from "@/features/videos/lib/video-row";

/** After a failed run, try again this much later instead of on every pg_cron tick. */
const RETRY_AFTER_MS = 5 * 60_000;

export interface PollLiveResult {
  skipped?: "not_due";
  /** When the next check is planned (pg_cron calls the app again only then). */
  nextCheckAt?: string;
  checked?: number;
  state?: string;
  videoId?: string;
  notified?: string[];
}

/**
 * One check of the channel's live state, then plans the next one (ADR-018/019): every
 * 2 minutes at the start of a shift until the stream is on, one check about 4 hours after
 * it started (then every 15 minutes while it runs over), otherwise not until the next slot
 * window (6-hour safety net). See docs/02-architecture.md, flow 1.
 */
export async function pollLive({ db, yt, channelId }: JobContext, now: Date, opts: { force?: boolean } = {}): Promise<PollLiveResult> {
  // Overrides from yesterday (Vietnam time can be a day ahead of UTC) onwards.
  const since = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  const [statusRes, pollRes, slotsRes, overridesRes] = await Promise.all([
    db.from("live_status").select("*").single(),
    db.from("live_poll_state").select("next_check_at").maybeSingle(),
    db.from("schedule_slots").select("*").eq("active", true),
    db.from("schedule_overrides").select("*").gte("date_vn", since),
  ]);
  if (statusRes.error) throw new Error(`live_status: ${statusRes.error.message}`);
  const prev = statusRes.data as LiveStatusRow;
  const schedule = ((slotsRes.data ?? []) as ScheduleSlotRow[]).map(mapSlot);
  const overrides = mapOverrides((overridesRes.data ?? []) as ScheduleOverrideRow[]);

  // pg_cron only calls when due; this guards manual or overlapping calls.
  const due = (pollRes.data as { next_check_at: string } | null)?.next_check_at;
  // 60 s tolerance: the DB clock (poll_live_due) and this server's clock may disagree a little.
  if (!opts.force && due && Date.parse(due) > now.getTime() + 60_000) return { skipped: "not_due", nextCheckAt: due };

  // Lease before any outbound call: if this run throws, the next try is in 5 minutes, not on
  // every pg_cron tick (each failed try may already have spent a YouTube unit). It also keeps
  // an overlapping tick from running the same check. The plan written at the end replaces it.
  await setTimer(db, { next_check_at: new Date(now.getTime() + RETRY_AFTER_MS).toISOString(), reason: "retry" });

  // Candidates: what we already think is live/upcoming plus the RSS feed (free), never search.list.
  // While live we only follow the known stream (to see it end); a new one reaches us through WebSub.
  const [activeRes, rssIds] = await Promise.all([
    db.from("videos").select("video_id").in("live_state", ["upcoming", "live"]),
    prev.state === "live" && prev.video_id ? Promise.resolve([] as string[]) : fetchRssVideoIds(channelId),
  ]);
  const activeIds = ((activeRes.data ?? []) as { video_id: string }[]).map((r) => r.video_id);
  // The stream we think is live goes first, so a pile of stale placeholders can never push it out.
  const ids = [...new Set([...(prev.video_id ? [prev.video_id] : []), ...activeIds, ...rssIds])].slice(0, 50);
  const items = ids.length ? await yt.videos(ids) : [];
  // The known stream ended without RSS this run: look once for a restart on a new video id
  // before going to sleep (RSS is free; at most one more unit, only right after a stream ends).
  if (prev.state === "live" && !items.some((v) => v.snippet.liveBroadcastContent === "live")) {
    const fresh = (await fetchRssVideoIds(channelId)).filter((id) => !ids.includes(id)).slice(0, 50);
    if (fresh.length) items.push(...(await yt.videos(fresh)));
  }

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
  }

  // Streams we tracked as active that YouTube no longer returns were deleted or made private.
  const returned = new Set(items.map((v) => v.id));
  const vanished = activeIds.filter((id) => !returned.has(id));
  if (vanished.length) await db.from("videos").update({ live_state: "none" }).in("video_id", vanished);

  const next = deriveLiveStatus(items, now);
  const row = {
    state: next.state,
    video_id: next.videoId ?? null,
    title: next.title ?? null,
    start_time: next.startTime ?? null,
    // The site no longer shows viewer counts (ADR-019): with two checks a stream it would only be stale.
    concurrent_viewers: null,
  };
  // Written only when something a visitor sees changed; the check time lives in live_poll_state.
  const differs =
    prev.state !== row.state ||
    (prev.video_id ?? null) !== row.video_id ||
    (prev.title ?? null) !== row.title ||
    !sameInstant(prev.start_time, row.start_time) ||
    (prev.concurrent_viewers ?? null) !== null;
  if (differs) {
    const upd = await db
      .from("live_status")
      .update({ ...row, checked_at: now.toISOString() })
      .eq("id", true);
    if (upd.error) throw new Error(`live_status update: ${upd.error.message}`);
  }

  let plan: { at: Date; reason: string } = nextCheckAt({
    now,
    live: next,
    previous: prev.state,
    previousStart: prev.start_time ?? undefined,
    schedule,
    overrides,
  });
  // WebSub or a schedule edit may have woken the timer while this check ran (after our lease):
  // keep that earlier wake instead of overwriting it with a plan hours away.
  const woken = (await db.from("live_poll_state").select("next_check_at, reason").maybeSingle()).data as {
    next_check_at: string;
    reason: string | null;
  } | null;
  if (woken && woken.reason !== "retry" && Date.parse(woken.next_check_at) < plan.at.getTime()) {
    plan = { at: new Date(Math.max(Date.parse(woken.next_check_at), now.getTime() + 60_000)), reason: woken.reason ?? "websub" };
  }
  await setTimer(db, { checked_at: now.toISOString(), next_check_at: plan.at.toISOString(), reason: plan.reason });

  // /api/live carries nextCheckAt: refresh it after every check (one small route). A 30 s
  // stale window instead of 0: if a regeneration fails, readers keep the last copy instead of
  // turning every tab read into a function call; tabs read 90 s after the plan anyway. Pages only when what they show changed,
  // so the start-of-shift checks every 2 minutes do not regenerate every page.
  revalidateTag(TAGS.liveTimer, { expire: 30 });
  if (differs) revalidateTag(TAGS.live, "max");
  const changed = prev.state !== next.state || (prev.video_id ?? undefined) !== next.videoId;
  if (changed) revalidateTag(TAGS.videos, "max");

  let notified: string[] = [];
  if (becameLive(prev.state, next, prev.video_id ?? undefined) && next.videoId) {
    notified = await notifyLive(db, { videoId: next.videoId, title: next.title ?? "" });
  }
  return { checked: items.length, state: next.state, videoId: next.videoId, notified, nextCheckAt: plan.at.toISOString() };
}

/** Upsert, not update: if the single row were ever deleted, poll_live_due() would stay true forever. */
async function setTimer(db: JobContext["db"], values: { next_check_at: string; reason: string; checked_at?: string }) {
  const res = await db.from("live_poll_state").upsert({ id: true, ...values }, { onConflict: "id" });
  if (res.error) throw new Error(`live_poll_state: ${res.error.message}`);
}

function sameInstant(a: string | null | undefined, b: string | null): boolean {
  if (!a || !b) return (a ?? null) === b;
  return Date.parse(a) === Date.parse(b);
}
