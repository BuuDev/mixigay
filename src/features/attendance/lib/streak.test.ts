import { describe, expect, it } from "vitest";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import {
  BADGES,
  computeStreak,
  EMPTY_STREAK,
  flameLevel,
  newlyUnlocked,
  nextBadge,
  normalizeDates,
  unlockedBadges,
  withToday,
  type StreakStats,
} from "./streak";

// The real weekly rhythm: Mon/Tue/Thu/Fri 22:22, Sat 23:00, off Wed/Sun.
// 2026-11-09 is a Monday: 9 Mon, 10 Tue, 11 Wed (off), 12 Thu, 13 Fri, 14 Sat, 15 Sun (off), 16 Mon.
const schedule: ScheduleSlot[] = [
  { id: "mon", dayOfWeek: 1, time: "22:22", title: "Live" },
  { id: "tue", dayOfWeek: 2, time: "22:22", title: "Live" },
  { id: "thu", dayOfWeek: 4, time: "22:22", title: "Live" },
  { id: "fri", dayOfWeek: 5, time: "22:22", title: "Live" },
  { id: "sat", dayOfWeek: 6, time: "23:00", title: "Live" },
];
const vn = (iso: string) => new Date(`${iso}+07:00`);
const stats = (s: Partial<StreakStats>): StreakStats => ({ ...EMPTY_STREAK, ...s });

describe("computeStreak", () => {
  it("is empty without dates", () => {
    expect(computeStreak([], schedule, [], vn("2026-11-12T20:00:00"))).toEqual(EMPTY_STREAK);
  });

  it("counts consecutive stream nights across an off day", () => {
    // Mon, Tue, (Wed off), Thu — tapped tonight.
    const s = computeStreak(["2026-11-09", "2026-11-10", "2026-11-12"], schedule, [], vn("2026-11-12T22:30:00"));
    expect(s).toEqual({ current: 3, best: 3, total: 3, attendedToday: true, atRisk: false });
  });

  it("does not break on the weekend off day (Sat → Mon)", () => {
    const s = computeStreak(["2026-11-13", "2026-11-14", "2026-11-16"], schedule, [], vn("2026-11-16T23:00:00"));
    expect(s.current).toBe(3);
  });

  it("breaks on a missed stream night", () => {
    // Mon, Tue, missed Thu, Fri.
    const s = computeStreak(["2026-11-09", "2026-11-10", "2026-11-13"], schedule, [], vn("2026-11-13T23:00:00"));
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
    expect(s.total).toBe(3);
  });

  it("keeps yesterday's streak while tonight is not tapped yet, and flags it at risk", () => {
    const dates = ["2026-11-09", "2026-11-10"];
    // Thursday evening, before the stream and during it, up to 23:59 VN.
    for (const at of ["2026-11-12T08:00:00", "2026-11-12T22:22:00", "2026-11-12T23:59:59"]) {
      expect(computeStreak(dates, schedule, [], vn(at))).toEqual({ current: 2, best: 2, total: 2, attendedToday: false, atRisk: true });
    }
  });

  it("breaks at Vietnam midnight after a missed night", () => {
    const s = computeStreak(["2026-11-09", "2026-11-10"], schedule, [], vn("2026-11-13T00:00:00"));
    expect(s.current).toBe(0);
    expect(s.best).toBe(2);
    expect(s.atRisk).toBe(false);
  });

  it("uses the Vietnam day, not UTC, around 22:22–23:59 VN", () => {
    // 23:30 VN Thursday = 16:30Z Thursday; 00:30 VN Friday = 17:30Z Thursday (same UTC day).
    const dates = ["2026-11-10", "2026-11-12"];
    expect(computeStreak(dates, schedule, [], new Date("2026-11-12T16:30:00Z"))).toMatchObject({ current: 2, attendedToday: true });
    const friday = computeStreak(dates, schedule, [], new Date("2026-11-12T17:30:00Z"));
    expect(friday).toMatchObject({ current: 2, attendedToday: false, atRisk: true });
  });

  it("an off day today is not at risk", () => {
    const s = computeStreak(["2026-11-09", "2026-11-10"], schedule, [], vn("2026-11-11T21:00:00"));
    expect(s).toMatchObject({ current: 2, atRisk: false });
  });

  it("a cancelled night does not break the streak", () => {
    const overrides: ScheduleOverride[] = [{ dateVn: "2026-11-12", cancelled: true }];
    const s = computeStreak(["2026-11-10", "2026-11-13"], schedule, overrides, vn("2026-11-13T23:00:00"));
    expect(s.current).toBe(2);
    // Without the override the missed Thursday breaks it.
    expect(computeStreak(["2026-11-10", "2026-11-13"], schedule, [], vn("2026-11-13T23:00:00")).current).toBe(1);
  });

  it("an extra stream on an off day must be attended", () => {
    const overrides: ScheduleOverride[] = [{ dateVn: "2026-11-11", cancelled: false, time: "21:00" }];
    const s = computeStreak(["2026-11-10", "2026-11-12"], schedule, overrides, vn("2026-11-12T23:00:00"));
    expect(s.current).toBe(1);
  });

  it("a note-only override keeps the regular night", () => {
    const overrides: ScheduleOverride[] = [{ dateVn: "2026-11-12", cancelled: false, note: "Muộn chút" }];
    expect(computeStreak(["2026-11-10", "2026-11-13"], schedule, overrides, vn("2026-11-13T23:00:00")).current).toBe(1);
  });

  it("a tap on an off day counts and never breaks", () => {
    const s = computeStreak(["2026-11-10", "2026-11-11", "2026-11-12"], schedule, [], vn("2026-11-12T23:00:00"));
    expect(s).toMatchObject({ current: 3, total: 3 });
  });

  it("ignores junk, duplicates and future dates", () => {
    const s = computeStreak(["2026-11-10", "2026-11-10", "nope", "2026-13-45", "2026-11-20"], schedule, [], vn("2026-11-10T23:00:00"));
    expect(s).toMatchObject({ current: 1, total: 1, attendedToday: true });
  });

  it("keeps the best run from long ago", () => {
    const dates = ["2026-01-05", "2026-01-06", "2026-01-08", "2026-01-09", "2026-01-10", "2026-11-10"]; // Mon..Sat of a January week
    const s = computeStreak(dates, schedule, [], vn("2026-11-10T23:00:00"));
    expect(s).toMatchObject({ current: 1, best: 5, total: 6 });
  });

  it("never breaks without a schedule", () => {
    expect(computeStreak(["2026-11-09", "2026-11-11"], [], [], vn("2026-11-11T22:00:00")).current).toBe(2);
  });
});

describe("normalizeDates / withToday", () => {
  it("sorts, dedupes and caps at today", () => {
    expect(normalizeDates(["2026-11-12", "2026-11-09", "2026-11-12", "2026-11-30"], "2026-11-12")).toEqual(["2026-11-09", "2026-11-12"]);
  });

  it("toggles today's tap", () => {
    expect(withToday(["2026-11-09"], "2026-11-10", true)).toEqual(["2026-11-09", "2026-11-10"]);
    expect(withToday(["2026-11-09", "2026-11-10"], "2026-11-10", false)).toEqual(["2026-11-09"]);
    expect(withToday(["2026-11-10"], "2026-11-10", true)).toEqual(["2026-11-10"]);
  });
});

describe("badges", () => {
  it("are ordered by threshold with the documented bases", () => {
    expect(BADGES.map((b) => [b.threshold, b.basis])).toEqual([
      [3, "total"],
      [7, "streak"],
      [30, "total"],
      [100, "total"],
    ]);
  });

  it("unlocks by total or best streak", () => {
    expect(unlockedBadges(stats({ total: 2, best: 2 }))).toEqual([]);
    expect(unlockedBadges(stats({ total: 3, best: 1 })).map((b) => b.id)).toEqual(["tan-binh"]);
    expect(unlockedBadges(stats({ total: 40, best: 6 })).map((b) => b.id)).toEqual(["tan-binh", "lao-lang"]);
    expect(unlockedBadges(stats({ total: 100, best: 7 })).map((b) => b.id)).toEqual(["tan-binh", "chien-binh", "lao-lang", "huyen-thoai"]);
  });

  it("nextBadge gives progress from total, or from the current run for a streak badge", () => {
    expect(nextBadge(stats({ total: 1, current: 1, best: 1 }))).toMatchObject({ badge: { id: "tan-binh" }, value: 1, remaining: 2 });
    const toWarrior = nextBadge(stats({ total: 12, current: 4, best: 6 }));
    expect(toWarrior).toMatchObject({ badge: { id: "chien-binh" }, value: 4, remaining: 3 });
    expect(toWarrior?.progress).toBeCloseTo(4 / 7);
    expect(nextBadge(stats({ total: 29, current: 2, best: 8 }))).toMatchObject({ badge: { id: "lao-lang" }, value: 29, remaining: 1 });
    expect(nextBadge(stats({ total: 100, current: 1, best: 7 }))).toBeNull();
  });

  it("newlyUnlocked lists what a tap just reached", () => {
    expect(newlyUnlocked(stats({ total: 2, best: 2 }), stats({ total: 3, best: 3 })).map((b) => b.id)).toEqual(["tan-binh"]);
    expect(newlyUnlocked(stats({ total: 9, best: 6 }), stats({ total: 10, best: 7 })).map((b) => b.id)).toEqual(["chien-binh"]);
    expect(newlyUnlocked(stats({ total: 10, best: 7 }), stats({ total: 11, best: 7 }))).toEqual([]);
  });

  it("flameLevel grows with the streak", () => {
    expect([0, 1, 2, 3, 6, 7, 29, 30, 200].map(flameLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});
