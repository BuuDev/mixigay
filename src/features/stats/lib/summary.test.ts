import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LiveSample, StreamSummary } from "../types";
import { averageDuration, averageStartByWeekday, buildStreamStats, longestStreak, topByPeak } from "./summary";

const stream = (startAt: string, over: Partial<StreamSummary> = {}): StreamSummary => ({
  videoId: startAt,
  title: "",
  startAt,
  endAt: startAt,
  durationMinutes: 0,
  peakViewers: 0,
  peakMinute: 0,
  avgViewers: 0,
  sampleCount: 0,
  ...over,
});

function suite() {
  describe("averageStartByWeekday", () => {
    it("averages Vietnam start times, Monday first", () => {
      const out = averageStartByWeekday([
        stream("2026-11-02T13:00:00Z"), // Mon 20:00 VN
        stream("2026-11-09T13:30:00Z"), // Mon 20:30 VN
        stream("2026-11-07T14:00:00Z"), // Sat 21:00 VN
      ]);
      expect(out.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
      expect(out[0]).toEqual({ weekday: 1, count: 2, avgStartMinute: 20 * 60 + 15 });
      expect(out[5]).toEqual({ weekday: 6, count: 1, avgStartMinute: 21 * 60 });
      expect(out[1]).toEqual({ weekday: 2, count: 0, avgStartMinute: null });
    });

    it("keeps after-midnight starts on the night before instead of averaging to noon", () => {
      const out = averageStartByWeekday([
        stream("2026-11-07T16:50:00Z"), // Sat 23:50 VN
        stream("2026-11-14T17:10:00Z"), // Sun 00:10 VN → Saturday night
      ]);
      expect(out[5]).toEqual({ weekday: 6, count: 2, avgStartMinute: 24 * 60 });
      expect(out[6].count).toBe(0);
    });
  });

  describe("averageDuration", () => {
    it("averages positive lengths only", () => {
      expect(averageDuration([{ durationMinutes: 200 }, { durationMinutes: 301 }, { durationMinutes: 0 }])).toBe(251);
      expect(averageDuration([{ durationMinutes: 0 }])).toBeNull();
      expect(averageDuration([])).toBeNull();
    });
  });

  describe("longestStreak", () => {
    it("finds the longest run of consecutive stream days", () => {
      const out = longestStreak([
        stream("2026-11-01T13:00:00Z"),
        stream("2026-11-03T13:00:00Z"),
        stream("2026-11-04T13:00:00Z"),
        stream("2026-11-04T15:00:00Z"), // two streams the same night count once
        stream("2026-11-05T17:30:00Z"), // Fri 00:30 VN, still Thursday's night
        stream("2026-11-08T13:00:00Z"),
      ]);
      expect(out).toEqual({ days: 3, from: "2026-11-03", to: "2026-11-05" });
    });

    it("prefers the most recent run on a tie and spans month ends", () => {
      expect(
        longestStreak([stream("2026-10-30T13:00:00Z"), stream("2026-10-31T13:00:00Z"), stream("2026-11-02T13:00:00Z"), stream("2026-11-03T13:00:00Z")]),
      ).toEqual({
        days: 2,
        from: "2026-11-02",
        to: "2026-11-03",
      });
      expect(longestStreak([stream("2026-10-31T13:00:00Z"), stream("2026-11-01T13:00:00Z")])).toEqual({ days: 2, from: "2026-10-31", to: "2026-11-01" });
    });

    it("handles one stream and none", () => {
      expect(longestStreak([stream("2026-11-01T13:00:00Z")])).toEqual({ days: 1, from: "2026-11-01", to: "2026-11-01" });
      expect(longestStreak([])).toBeNull();
    });
  });

  describe("topByPeak", () => {
    it("ranks by peak, newer first on ties, skips streams without readings", () => {
      const a = stream("2026-11-01T13:00:00Z", { videoId: "a", peakViewers: 50 });
      const b = stream("2026-11-02T13:00:00Z", { videoId: "b", peakViewers: 90 });
      const c = stream("2026-11-03T13:00:00Z", { videoId: "c", peakViewers: 50 });
      const d = stream("2026-11-04T13:00:00Z", { videoId: "d", peakViewers: 0 });
      expect(topByPeak([a, b, c, d], 10).map((s) => s.videoId)).toEqual(["b", "c", "a"]);
      expect(topByPeak([a, b, c, d], 1).map((s) => s.videoId)).toEqual(["b"]);
    });
  });

  describe("buildStreamStats", () => {
    const samples: LiveSample[] = [];
    // Three nights in a row, 120 one-minute samples each, rising then falling.
    ["2026-11-04T13:00:00Z", "2026-11-05T13:00:00Z", "2026-11-06T13:30:00Z"].forEach((start, k) => {
      for (let i = 0; i < 120; i++) {
        samples.push({
          videoId: `v${k}`,
          sampledAt: new Date(Date.parse(start) + i * 60_000).toISOString(),
          viewers: (k + 1) * 1000 + Math.min(i, 120 - i) * 10,
        });
      }
    });
    const stats = buildStreamStats(samples, [{ videoId: "v2", title: "Đêm thứ ba" }], { windowDays: 90, recentCount: 2, topCount: 2, maxPoints: 40 });

    it("summarises the window", () => {
      expect(stats.windowDays).toBe(90);
      expect(stats.streamCount).toBe(3);
      expect(stats.avgDurationMinutes).toBe(119);
      expect(stats.streak).toEqual({ days: 3, from: "2026-11-04", to: "2026-11-06" });
      expect(stats.weekdays.find((d) => d.weekday === 5)).toEqual({ weekday: 5, count: 1, avgStartMinute: 20 * 60 + 30 });
    });

    it("ranks top streams and keeps charts small", () => {
      expect(stats.top.map((s) => s.videoId)).toEqual(["v2", "v1"]);
      expect(stats.top[0]).not.toHaveProperty("points");
      expect(stats.top[0].peakViewers).toBe(3600);
      expect(stats.recent.map((s) => s.videoId)).toEqual(["v2", "v1"]);
      expect(stats.recent[0].title).toBe("Đêm thứ ba");
      expect(stats.recent[0].points.length).toBeLessThanOrEqual(40);
      expect(stats.recent[0].points.some((p) => p.viewers === 3600)).toBe(true);
    });

    it("is empty without samples", () => {
      const empty = buildStreamStats([], [], { windowDays: 90 });
      expect(empty).toMatchObject({ streamCount: 0, avgDurationMinutes: null, streak: null, top: [], recent: [] });
      expect(empty.weekdays.every((d) => d.count === 0)).toBe(true);
    });
  });
}

suite();

describe("under another server time zone", () => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "America/New_York";
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });
  suite();
});
