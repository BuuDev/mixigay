import { vnDateKey } from "@/features/schedule/lib/overrides";
import { nextSlot, prevSlot } from "@/features/schedule/lib/schedule";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import type { TonightPlan } from "../types";

/** "YYYY-MM-DD" of the Vietnam calendar day an RSVP made at `now` belongs to (matches `public.today_vn()`). */
export function attendanceDay(now: Date): string {
  return vnDateKey(now);
}

/**
 * Tonight's stream for the RSVP line: the next stream when it is still today
 * (Vietnam day), else today's stream that already started, else a day off with
 * the following stream.
 */
export function tonightPlan(schedule: ScheduleSlot[], overrides: readonly ScheduleOverride[] | undefined, now: Date): TonightPlan {
  const dateVn = attendanceDay(now);
  const next = nextSlot(schedule, now, overrides);
  if (next && vnDateKey(next.at) === dateVn) return { kind: "stream", dateVn, time: next.slot.time };
  const prev = prevSlot(schedule, now, overrides);
  if (prev && vnDateKey(prev.at) === dateVn) return { kind: "stream", dateVn, time: prev.slot.time };
  return { kind: "off", dateVn, next };
}

/**
 * Count to show: the server's count with the viewer's own tap swapped for its
 * current (optimistic) state, so a stale cached count never hides it.
 */
export function shownCount(serverCount: number, serverAttended: boolean, attended: boolean): number {
  return Math.max(0, serverCount - (serverAttended ? 1 : 0) + (attended ? 1 : 0));
}
