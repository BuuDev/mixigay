import { describe, expect, it } from "vitest";
import { becameLive, deriveLiveStatus, shouldPoll } from "./live";
import type { ScheduleSlot } from "@/features/schedule/types";
import type { YtVideo } from "@/server/youtube/client";

const now = new Date("2026-11-09T12:00:00Z"); // Monday 19:00 VN

function video(id: string, kind: YtVideo["snippet"]["liveBroadcastContent"], live: YtVideo["liveStreamingDetails"] = {}): YtVideo {
  return { id, snippet: { title: `t-${id}`, publishedAt: now.toISOString(), liveBroadcastContent: kind }, liveStreamingDetails: live };
}

describe("deriveLiveStatus", () => {
  it("prefers the live stream with the most viewers", () => {
    const result = deriveLiveStatus(
      [
        video("a", "live", { concurrentViewers: "10", actualStartTime: "2026-11-09T11:00:00Z" }),
        video("b", "live", { concurrentViewers: "500" }),
        video("c", "upcoming", { scheduledStartTime: "2026-11-09T13:00:00Z" }),
      ],
      now,
    );
    expect(result).toMatchObject({ state: "live", videoId: "b", concurrentViewers: 500 });
  });

  it("reports the soonest upcoming stream within 24 hours", () => {
    const result = deriveLiveStatus(
      [
        video("later", "upcoming", { scheduledStartTime: "2026-11-09T20:00:00Z" }),
        video("soon", "upcoming", { scheduledStartTime: "2026-11-09T13:00:00Z" }),
        video("far", "upcoming", { scheduledStartTime: "2026-11-20T13:00:00Z" }),
      ],
      now,
    );
    expect(result).toMatchObject({ state: "upcoming", videoId: "soon", startTime: "2026-11-09T13:00:00Z" });
  });

  it("drops a scheduled stream that never started hours ago", () => {
    expect(deriveLiveStatus([video("x", "upcoming", { scheduledStartTime: "2026-11-09T01:00:00Z" })], now).state).toBe("offline");
  });

  it("is offline when nothing is live or upcoming", () => {
    expect(deriveLiveStatus([video("v", "none")], now)).toEqual({ state: "offline" });
  });
});

describe("shouldPoll", () => {
  const slots: ScheduleSlot[] = [{ id: "mon", dayOfWeek: 1, time: "20:00", title: "Mon" }]; // 13:00Z

  it("always polls while live or upcoming", () => {
    expect(shouldPoll({ now, state: "live", lastCheckedAt: now.toISOString(), schedule: [] })).toBe(true);
    expect(shouldPoll({ now, state: "upcoming", lastCheckedAt: now.toISOString(), schedule: [] })).toBe(true);
  });

  it("polls every minute within 2 hours of a slot", () => {
    expect(shouldPoll({ now, state: "offline", lastCheckedAt: "2026-11-09T11:59:00Z", schedule: slots })).toBe(true);
  });

  it("also polls just after a slot's start time", () => {
    const after = new Date("2026-11-09T14:30:00Z");
    expect(shouldPoll({ now: after, state: "offline", lastCheckedAt: "2026-11-09T14:29:00Z", schedule: slots })).toBe(true);
  });

  it("thins out to every 5 minutes far from any slot", () => {
    const quiet = new Date("2026-11-09T03:00:00Z");
    expect(shouldPoll({ now: quiet, state: "offline", lastCheckedAt: "2026-11-09T02:59:00Z", schedule: slots })).toBe(false);
    expect(shouldPoll({ now: quiet, state: "offline", lastCheckedAt: "2026-11-09T02:55:00Z", schedule: slots })).toBe(true);
  });

  it("follows one-day overrides: moved, cancelled and extra streams", () => {
    const checked = "2026-11-09T11:59:00Z";
    // Monday 20:00 VN moved to 23:00 VN (16:00Z): at 19:00 VN the stream is 4 h away.
    const moved = [{ dateVn: "2026-11-09", cancelled: false, time: "23:00" }];
    expect(shouldPoll({ now, state: "offline", lastCheckedAt: checked, schedule: slots, overrides: moved })).toBe(false);
    expect(
      shouldPoll({ now: new Date("2026-11-09T15:00:00Z"), state: "offline", lastCheckedAt: "2026-11-09T14:59:00Z", schedule: slots, overrides: moved }),
    ).toBe(true);
    // Monday cancelled: no dense window.
    const cancelled = [{ dateVn: "2026-11-09", cancelled: true }];
    expect(shouldPoll({ now, state: "offline", lastCheckedAt: checked, schedule: slots, overrides: cancelled })).toBe(false);
    // Extra stream on Tuesday 10:00 VN (03:00Z), a day with no weekly slot.
    const extra = [{ dateVn: "2026-11-10", cancelled: false, time: "10:00", title: "Live thêm" }];
    expect(
      shouldPoll({ now: new Date("2026-11-10T02:00:00Z"), state: "offline", lastCheckedAt: "2026-11-10T01:59:00Z", schedule: slots, overrides: extra }),
    ).toBe(true);
  });

  it("polls when there is no previous check", () => {
    expect(shouldPoll({ now, state: "offline", schedule: [] })).toBe(true);
  });
});

describe("becameLive", () => {
  it("fires on offline → live and on a new live video", () => {
    expect(becameLive("offline", { state: "live", videoId: "a" })).toBe(true);
    expect(becameLive("live", { state: "live", videoId: "b" }, "a")).toBe(true);
  });

  it("does not fire while the same stream stays live", () => {
    expect(becameLive("live", { state: "live", videoId: "a" }, "a")).toBe(false);
    expect(becameLive("live", { state: "offline" }, "a")).toBe(false);
  });
});
