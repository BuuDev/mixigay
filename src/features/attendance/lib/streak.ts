import { dayKey, effectiveSlots, vnDay } from "@/features/schedule/lib/overrides";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";

// A fan's own "Chuỗi có mặt", counted in stream nights (Vietnam calendar days, the
// same key as `public.attendance.date_vn` / `attendanceDay`). Personal only: it is
// computed from the viewer's own dates and never compared with other fans.
//
// Rules:
//  - a stream night is a Vietnam day with a stream after the schedule + overrides
//    (`effectiveSlots`); off days (Wed/Sun) and cancelled days never break a streak;
//  - a stream night without a tap breaks it, but only once that day is over: tonight
//    not tapped yet keeps yesterday's streak alive until Vietnam midnight (the RSVP
//    can be made until then, `public.today_vn()`);
//  - a tap on a day that turned out to be off still counts (it extends, never breaks);
//  - the past is judged with today's weekly schedule (old schedules are not stored),
//    plus every override row (getScheduleOverrides returns past ones too).

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface StreakStats {
  /** Consecutive stream nights attended, up to tonight (tonight counts once tapped). */
  current: number;
  /** Longest such run ever. */
  best: number;
  /** Nights attended in total. */
  total: number;
  /** Whether today (Vietnam day) is already tapped. */
  attendedToday: boolean;
  /** Today is a stream night not tapped yet and there is a streak to keep. */
  atRisk: boolean;
}

export const EMPTY_STREAK: StreakStats = { current: 0, best: 0, total: 0, attendedToday: false, atRisk: false };

function fromKey(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}

function isStreamNight(schedule: readonly ScheduleSlot[], overrides: readonly ScheduleOverride[] | undefined, day: Date): boolean {
  return effectiveSlots(schedule, day, overrides).length > 0;
}

/** Valid, unique "YYYY-MM-DD" dates up to `todayKey`, oldest first. */
export function normalizeDates(dates: readonly string[], todayKey: string): string[] {
  const set = new Set<string>();
  for (const d of dates) if (typeof d === "string" && DATE_RE.test(d) && d <= todayKey && !Number.isNaN(fromKey(d).getTime())) set.add(d);
  return [...set].sort();
}

/**
 * Streak stats from the fan's attendance dates (Vietnam days) at `now`. Pure:
 * pass the request/client clock in (`useNow`, or `new Date()` after `connection()`).
 */
export function computeStreak(
  dates: readonly string[],
  schedule: readonly ScheduleSlot[],
  overrides: readonly ScheduleOverride[] | undefined,
  now: Date,
): StreakStats {
  const today = vnDay(now);
  const todayKey = dayKey(today);
  const days = normalizeDates(dates, todayKey);
  const streamToday = isStreamNight(schedule, overrides, today);
  if (!days.length) return EMPTY_STREAK;

  const attended = new Set(days);
  let run = 0;
  let best = 0;
  // Walk every Vietnam day from the first tap to today (a few thousand at most).
  for (let t = fromKey(days[0]).getTime(); t <= today.getTime(); t += DAY_MS) {
    const day = new Date(t);
    const key = dayKey(day);
    if (attended.has(key)) {
      run += 1;
      if (run > best) best = run;
    } else if (key !== todayKey && isStreamNight(schedule, overrides, day)) {
      run = 0;
    }
  }
  const attendedToday = attended.has(todayKey);
  return { current: run, best, total: days.length, attendedToday, atRisk: streamToday && !attendedToday && run > 0 };
}

/** The dates with today's tap set on or off (for the optimistic state of the button). */
export function withToday(history: readonly string[], todayKey: string, attended: boolean): string[] {
  const rest = history.filter((d) => d !== todayKey);
  return attended ? [...rest, todayKey] : rest;
}

// ===== Badges =====

export type BadgeId = "tan-binh" | "chien-binh" | "lao-lang" | "huyen-thoai";

export interface StreakBadgeDef {
  id: BadgeId;
  name: string;
  /** Nights needed. */
  threshold: number;
  /**
   * "total": nights attended overall, so a busy week never takes it away.
   * "streak": the best run ever (once reached, kept), progress shown from the current run.
   */
  basis: "total" | "streak";
  /** What earns it, shown under the name. */
  hint: string;
}

/**
 * Tiers, lowest first. Only "Chiến binh 22:22" asks for a run (7 nights in a row is
 * a bit under two weeks of streams); the others count all nights, because 30 or 100
 * in a row would punish a single missed evening. Names are our own, not quotes.
 */
export const BADGES: readonly StreakBadgeDef[] = [
  { id: "tan-binh", name: "Tân binh Bộ Tộc", threshold: 3, basis: "total", hint: "Có mặt 3 buổi live" },
  { id: "chien-binh", name: "Chiến binh 22:22", threshold: 7, basis: "streak", hint: "Có mặt 7 buổi live liên tiếp" },
  { id: "lao-lang", name: "Lão làng", threshold: 30, basis: "total", hint: "Có mặt 30 buổi live" },
  { id: "huyen-thoai", name: "Huyền thoại Bộ Tộc", threshold: 100, basis: "total", hint: "Có mặt 100 buổi live" },
];

function earned(badge: StreakBadgeDef, stats: StreakStats): boolean {
  return (badge.basis === "total" ? stats.total : stats.best) >= badge.threshold;
}

/** Badges reached so far, lowest first. */
export function unlockedBadges(stats: StreakStats): StreakBadgeDef[] {
  return BADGES.filter((b) => earned(b, stats));
}

export interface BadgeProgress {
  badge: StreakBadgeDef;
  /** Nights counted toward it now (total, or the current run for a streak badge). */
  value: number;
  /** 0…1 (never 1: it would be unlocked). */
  progress: number;
  /** Nights still needed. */
  remaining: number;
}

/** The lowest badge not reached yet with the progress toward it, or null when all are earned. */
export function nextBadge(stats: StreakStats): BadgeProgress | null {
  const badge = BADGES.find((b) => !earned(b, stats));
  if (!badge) return null;
  const value = Math.min(badge.threshold - 1, badge.basis === "total" ? stats.total : stats.current);
  return { badge, value, progress: value / badge.threshold, remaining: badge.threshold - value };
}

/** Badges earned in `after` but not in `before` (what a tap just unlocked). */
export function newlyUnlocked(before: StreakStats, after: StreakStats): StreakBadgeDef[] {
  return BADGES.filter((b) => earned(b, after) && !earned(b, before));
}

/** Flame size step for the UI: 0 none, 1 spark (1–2), 2 small (3–6), 3 big (7–29), 4 blaze (30+). */
export function flameLevel(current: number): 0 | 1 | 2 | 3 | 4 {
  if (current <= 0) return 0;
  if (current < 3) return 1;
  if (current < 7) return 2;
  if (current < 30) return 3;
  return 4;
}
