import { describe, expect, it } from "vitest";
import { becameLive, deriveLiveStatus, nextCheckAt } from "./live";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import type { DerivedLive } from "./live";
import type { LiveState } from "../types";
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

describe("nextCheckAt", () => {
  // Monday 20:00 VN = 13:00Z; `now` (12:00Z) is one hour before it. Its window: 12:50Z–14:00Z.
  const slots: ScheduleSlot[] = [{ id: "mon", dayOfWeek: 1, time: "20:00", title: "Mon" }];
  const offline: DerivedLive = { state: "offline" };
  const at = (iso: string) => new Date(iso);
  const check = (
    nowIso: string,
    live: DerivedLive = offline,
    previous: LiveState = "offline",
    overrides?: ScheduleOverride[],
    schedule = slots,
    previousStart?: string,
  ) => nextCheckAt({ now: at(nowIso), live, previous, previousStart, schedule, overrides });

  it("sleeps until 10 minutes before the next slot when nothing is on", () => {
    expect(check("2026-11-09T12:00:00Z")).toEqual({ at: at("2026-11-09T12:50:00Z"), reason: "next_slot" });
  });

  it("never sleeps longer than the 6-hour safety net", () => {
    expect(check("2026-11-09T03:00:00Z")).toEqual({ at: at("2026-11-09T09:00:00Z"), reason: "safety" });
    expect(check("2026-11-09T03:00:00Z", offline, "offline", undefined, [])).toEqual({ at: at("2026-11-09T09:00:00Z"), reason: "safety" });
  });

  it("checks every 2 minutes from 10 minutes before to 60 minutes after a slot", () => {
    expect(check("2026-11-09T12:50:00Z")).toEqual({ at: at("2026-11-09T12:52:00Z"), reason: "slot_window" });
    expect(check("2026-11-09T13:30:00Z").reason).toBe("slot_window");
    expect(check("2026-11-09T14:00:00Z").reason).toBe("slot_window");
    // Window over without a stream: next Monday is a week away, so the safety net decides.
    expect(check("2026-11-09T14:01:00Z")).toEqual({ at: at("2026-11-09T20:01:00Z"), reason: "safety" });
  });

  it("once live, sleeps until about 4 hours after the start (end of the shift)", () => {
    const live: DerivedLive = { state: "live", videoId: "v", startTime: "2026-11-09T13:02:00Z" };
    expect(check("2026-11-09T13:04:00Z", live, "offline")).toEqual({ at: at("2026-11-09T17:02:00Z"), reason: "live_end" });
    // Start time unknown: four hours from now.
    expect(check("2026-11-09T13:04:00Z", { state: "live", videoId: "v" }, "offline")).toEqual({ at: at("2026-11-09T17:04:00Z"), reason: "live_end" });
  });

  it("still live after the shift: every 15 minutes until it ends", () => {
    const live: DerivedLive = { state: "live", videoId: "v", startTime: "2026-11-09T13:02:00Z" };
    expect(check("2026-11-09T17:02:00Z", live, "live")).toEqual({ at: at("2026-11-09T17:17:00Z"), reason: "live_overtime" });
  });

  it("stops checking once the stream ended, even inside its window", () => {
    expect(check("2026-11-09T13:40:00Z", offline, "live", undefined, slots, "2026-11-09T13:01:00Z")).toEqual({
      at: at("2026-11-09T19:40:00Z"),
      reason: "safety",
    });
  });

  it("a stream that started before the window does not close it when it ends", () => {
    expect(check("2026-11-09T12:55:00Z", offline, "live", undefined, slots, "2026-11-09T09:00:00Z").reason).toBe("slot_window");
  });

  it("waits for a scheduled stream until 2 minutes before it, then every 2 minutes", () => {
    // No weekly slot here, so only the scheduled stream drives the plan.
    const upcoming: DerivedLive = { state: "upcoming", videoId: "u", startTime: "2026-11-09T13:30:00Z" };
    const c = (iso: string, l: DerivedLive) => check(iso, l, "offline", undefined, []);
    expect(c("2026-11-09T12:00:00Z", upcoming)).toEqual({ at: at("2026-11-09T13:28:00Z"), reason: "upcoming_wait" });
    expect(c("2026-11-09T13:28:00Z", upcoming)).toEqual({ at: at("2026-11-09T13:30:00Z"), reason: "upcoming_soon" });
    expect(c("2026-11-09T13:45:00Z", upcoming).reason).toBe("upcoming_soon");
    // Scheduled far ahead: the safety net still looks every 6 hours (it may be moved earlier).
    const far: DerivedLive = { state: "upcoming", videoId: "u", startTime: "2026-11-10T03:00:00Z" };
    expect(c("2026-11-09T12:00:00Z", far)).toEqual({ at: at("2026-11-09T18:00:00Z"), reason: "safety" });
  });

  it("a scheduled special later tonight does not hide the regular slot window", () => {
    const special: DerivedLive = { state: "upcoming", videoId: "u", startTime: "2026-11-09T16:00:00Z" }; // 23:00 VN
    expect(check("2026-11-09T12:00:00Z", special)).toEqual({ at: at("2026-11-09T12:50:00Z"), reason: "next_slot" });
    expect(check("2026-11-09T12:55:00Z", special).reason).toBe("slot_window");
  });

  it("gives up on a scheduled stream an hour after its start time", () => {
    const stale: DerivedLive = { state: "upcoming", videoId: "u", startTime: "2026-11-09T05:00:00Z" };
    expect(check("2026-11-09T05:30:00Z", stale).reason).toBe("upcoming_soon");
    expect(check("2026-11-09T06:01:00Z", stale)).toEqual({ at: at("2026-11-09T12:01:00Z"), reason: "safety" });
  });

  it("never schedules sooner than 2 minutes ahead, rounded up to pg_cron's minute tick", () => {
    expect(check("2026-11-09T12:49:30Z").at).toEqual(at("2026-11-09T12:52:00Z"));
    expect(check("2026-11-09T12:50:03Z")).toEqual({ at: at("2026-11-09T12:53:00Z"), reason: "slot_window" });
  });

  it("follows one-day overrides: moved, cancelled and extra streams", () => {
    // Monday 20:00 VN moved to 23:00 VN (16:00Z): its window opens at 15:50Z.
    const moved = [{ dateVn: "2026-11-09", cancelled: false, time: "23:00" }];
    expect(check("2026-11-09T12:55:00Z", offline, "offline", moved).reason).not.toBe("slot_window");
    expect(check("2026-11-09T14:00:00Z", offline, "offline", moved)).toEqual({ at: at("2026-11-09T15:50:00Z"), reason: "next_slot" });
    expect(check("2026-11-09T15:55:00Z", offline, "offline", moved).reason).toBe("slot_window");
    // Monday cancelled: no window at all.
    const cancelled = [{ dateVn: "2026-11-09", cancelled: true }];
    expect(check("2026-11-09T13:00:00Z", offline, "offline", cancelled).reason).toBe("safety");
    // Extra stream on Tuesday 10:00 VN (03:00Z), a day with no weekly slot.
    const extra = [{ dateVn: "2026-11-10", cancelled: false, time: "10:00", title: "Live thêm" }];
    expect(check("2026-11-10T02:55:00Z", offline, "offline", extra).reason).toBe("slot_window");
  });

  it("handles a slot just after midnight Vietnam time", () => {
    // Saturday 00:30 VN = Friday 17:30Z.
    const late: ScheduleSlot[] = [{ id: "sat", dayOfWeek: 6, time: "00:30", title: "Khuya" }];
    expect(check("2026-11-13T17:00:00Z", offline, "offline", undefined, late)).toEqual({ at: at("2026-11-13T17:20:00Z"), reason: "next_slot" });
    expect(check("2026-11-13T18:00:00Z", offline, "offline", undefined, late).reason).toBe("slot_window");
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
