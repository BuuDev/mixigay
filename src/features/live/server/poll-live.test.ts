import { beforeEach, describe, expect, it, vi } from "vitest";
import type { YtVideo } from "@/server/youtube/client";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("./notify", () => ({ notifyLive: vi.fn(async () => ["telegram"]) }));
vi.mock("@/features/videos/server/classifier", () => ({ loadClassifier: async () => () => null }));
vi.mock("@/features/videos/lib/video-row", () => ({
  toVideoColumns: (v: YtVideo) => ({ video_id: v.id, title: v.snippet.title, live_state: v.snippet.liveBroadcastContent }),
}));
const rss = vi.fn(async () => ["rss1"]);
vi.mock("@/server/youtube/client", () => ({ fetchRssVideoIds: () => rss() }));

const { pollLive } = await import("./poll-live");

// Monday 2026-11-09, slot 22:22 VN = 15:22Z.
const SLOT = { id: "s", day_of_week: 1, time_vn: "22:22:00", title: "Live tối Thứ Hai", game_slug: null, note: null, active: true };

interface Write {
  table: string;
  op: "update" | "upsert";
  values: Record<string, unknown>;
}

/** Just enough of the supabase-js builder for pollLive: reads return fixtures, writes are recorded. */
function fakeDb(tables: Record<string, unknown[]>) {
  const writes: Write[] = [];
  const from = (table: string) => {
    let write: Write | null = null;
    const result = () => ({ data: tables[table] ?? [], error: null });
    const b = {
      select: () => b,
      eq: () => b,
      in: () => b,
      gte: () => b,
      single: async () => ({ data: (tables[table] ?? [])[0], error: null }),
      maybeSingle: async () => ({ data: (tables[table] ?? [])[0] ?? null, error: null }),
      update: (values: Record<string, unknown>) => {
        write = { table, op: "update", values };
        writes.push(write);
        return b;
      },
      upsert: async (values: Record<string, unknown>) => {
        writes.push({ table, op: "upsert", values });
        // The single timer row is replaced, like the real upsert (poll-live re-reads it).
        if (table === "live_poll_state") tables[table] = [{ ...values }];
        return { error: null };
      },
      then: (resolve: (r: unknown) => unknown) => resolve(write ? { error: null } : result()),
    };
    return b;
  };
  return { db: { from } as never, writes };
}

const video = (id: string, kind: YtVideo["snippet"]["liveBroadcastContent"], details: YtVideo["liveStreamingDetails"] = {}): YtVideo => ({
  id,
  snippet: { title: `t-${id}`, publishedAt: "2026-11-09T00:00:00Z", liveBroadcastContent: kind },
  liveStreamingDetails: details,
});

function ctx(tables: Record<string, unknown[]>, items: YtVideo[]) {
  const { db, writes } = fakeDb(tables);
  const videos = vi.fn(async () => items);
  return { context: { db, yt: { videos } as never, channelId: "UC" }, writes, videos };
}

/** The plan poll-live wrote last (the first timer write is the 5-minute retry lease). */
const lastTimer = (writes: Write[]) => writes.filter((w) => w.table === "live_poll_state").at(-1);

const offlineStatus = { state: "offline", video_id: null, title: null, start_time: null, concurrent_viewers: null, checked_at: null };

beforeEach(() => rss.mockClear());

describe("pollLive", () => {
  it("does nothing before its timer is due (no YouTube call, no write)", async () => {
    const { context, writes, videos } = ctx(
      { live_status: [offlineStatus], live_poll_state: [{ next_check_at: "2026-11-09T15:12:00Z" }], schedule_slots: [SLOT] },
      [],
    );
    const r = await pollLive(context, new Date("2026-11-09T12:00:00Z"));
    expect(r).toEqual({ skipped: "not_due", nextCheckAt: "2026-11-09T15:12:00Z" });
    expect(videos).not.toHaveBeenCalled();
    expect(writes).toEqual([]);
  });

  it("leaves live_status alone when nothing changed, and plans the next slot window", async () => {
    const { context, writes } = ctx({ live_status: [offlineStatus], live_poll_state: [{ next_check_at: "2026-11-09T12:00:00Z" }], schedule_slots: [SLOT] }, [
      video("rss1", "none"),
    ]);
    const r = await pollLive(context, new Date("2026-11-09T14:00:00Z"));
    expect(writes.filter((w) => w.table === "live_status")).toEqual([]);
    const plan = lastTimer(writes);
    expect(plan?.values).toMatchObject({ next_check_at: "2026-11-09T15:12:00.000Z", reason: "next_slot" });
    expect(r.nextCheckAt).toBe("2026-11-09T15:12:00.000Z");
  });

  it("writes live_status once the stream goes live, notifies, then sleeps until the end of the shift", async () => {
    const live = video("v1", "live", { actualStartTime: "2026-11-09T15:20:00Z", concurrentViewers: "1200" });
    const { context, writes } = ctx({ live_status: [offlineStatus], live_poll_state: [{ next_check_at: "2026-11-09T15:21:00Z" }], schedule_slots: [SLOT] }, [
      live,
    ]);
    const r = await pollLive(context, new Date("2026-11-09T15:21:00Z"));
    expect(writes.find((w) => w.table === "live_status")?.values).toMatchObject({ state: "live", video_id: "v1", concurrent_viewers: null });
    expect(lastTimer(writes)?.values).toMatchObject({ next_check_at: "2026-11-09T19:20:00.000Z", reason: "live_end" });
    expect(r.notified).toEqual(["telegram"]);
  });

  it("while live, follows only the known stream (no RSS) and skips the write when nothing moved", async () => {
    const status = { state: "live", video_id: "v1", title: "t-v1", start_time: "2026-11-09T15:20:00+00:00", concurrent_viewers: null, checked_at: null };
    const live = video("v1", "live", { actualStartTime: "2026-11-09T15:20:00Z", concurrentViewers: "1200" });
    const { context, writes } = ctx(
      { live_status: [status], live_poll_state: [{ next_check_at: "2026-11-09T15:31:00Z" }], schedule_slots: [SLOT], videos: [{ video_id: "v1" }] },
      [live],
    );
    await pollLive(context, new Date("2026-11-09T15:31:00Z"));
    expect(rss).not.toHaveBeenCalled();
    expect(writes.filter((w) => w.table === "live_status")).toEqual([]);
  });

  it("stops after the stream ends instead of polling out the rest of the window", async () => {
    const status = { state: "live", video_id: "v1", title: "t-v1", start_time: "2026-11-09T15:20:00Z", concurrent_viewers: 900, checked_at: null };
    const { context, writes } = ctx(
      { live_status: [status], live_poll_state: [{ next_check_at: "2026-11-09T15:51:00Z" }], schedule_slots: [SLOT], videos: [{ video_id: "v1" }] },
      [video("v1", "none")],
    );
    await pollLive(context, new Date("2026-11-09T15:51:00Z"));
    expect(writes.find((w) => w.table === "live_status")?.values).toMatchObject({ state: "offline" });
    expect(lastTimer(writes)?.values).toMatchObject({ next_check_at: "2026-11-09T21:51:00.000Z", reason: "safety" });
  });

  it("force=1 checks even when the timer is not due", async () => {
    const { context, videos } = ctx({ live_status: [offlineStatus], live_poll_state: [{ next_check_at: "2026-11-09T15:12:00Z" }], schedule_slots: [SLOT] }, []);
    await pollLive(context, new Date("2026-11-09T12:00:00Z"), { force: true });
    expect(rss).toHaveBeenCalled();
    expect(videos).toHaveBeenCalledWith(["rss1"]);
  });

  it("takes a 5-minute lease before calling YouTube, so a failing run is not retried every minute", async () => {
    const { context, writes } = ctx({ live_status: [offlineStatus], live_poll_state: [{ next_check_at: "2026-11-09T15:12:00Z" }], schedule_slots: [SLOT] }, []);
    (context.yt as unknown as { videos: () => Promise<never> }).videos = async () => {
      throw new Error("boom");
    };
    await expect(pollLive(context, new Date("2026-11-09T15:12:00Z"))).rejects.toThrow("boom");
    const timers = writes.filter((w) => w.table === "live_poll_state");
    expect(timers).toHaveLength(1);
    expect(timers[0].values).toMatchObject({ next_check_at: "2026-11-09T15:17:00.000Z", reason: "retry" });
  });

  it("looks for a restarted stream in RSS once the known one ended", async () => {
    const status = { state: "live", video_id: "v1", title: "t-v1", start_time: "2026-11-09T15:20:00Z", concurrent_viewers: 900, checked_at: null };
    const { db, writes } = fakeDb({
      live_status: [status],
      live_poll_state: [{ next_check_at: "2026-11-09T16:21:00Z" }],
      schedule_slots: [SLOT],
      videos: [{ video_id: "v1" }],
    });
    const restarted = video("rss1", "live", { actualStartTime: "2026-11-09T16:15:00Z", concurrentViewers: "800" });
    const videos = vi.fn(async (ids: string[]) => (ids.includes("v1") ? [video("v1", "none")] : [restarted]));
    const r = await pollLive({ db, yt: { videos } as never, channelId: "UC" }, new Date("2026-11-09T16:21:00Z"));
    expect(rss).toHaveBeenCalledTimes(1);
    expect(videos).toHaveBeenLastCalledWith(["rss1"]);
    expect(r).toMatchObject({ state: "live", videoId: "rss1" });
    expect(lastTimer(writes)?.values).toMatchObject({ reason: "live_end" });
  });

  it("keeps a WebSub wake that landed while the check was running", async () => {
    const tables: Record<string, unknown[]> = {
      live_status: [offlineStatus],
      live_poll_state: [{ next_check_at: "2026-11-09T12:00:00Z" }],
      schedule_slots: [SLOT],
    };
    const { db, writes } = fakeDb(tables);
    // WebSub writes its wake right after poll-live's lease, before the plan is written.
    const videos = vi.fn(async () => {
      tables.live_poll_state = [{ next_check_at: "2026-11-09T12:00:30Z", reason: "websub" }];
      return [video("rss1", "none")];
    });
    await pollLive({ db, yt: { videos } as never, channelId: "UC" }, new Date("2026-11-09T12:00:00Z"));
    expect(lastTimer(writes)?.values).toMatchObject({ next_check_at: "2026-11-09T12:01:00.000Z", reason: "websub" });
  });
});
