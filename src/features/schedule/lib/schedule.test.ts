import { describe, expect, it } from "vitest";
import { isOffDay, nextOccurrence, nextSlot } from "./schedule";
import type { ScheduleSlot } from "../types";

const slot = (dayOfWeek: number, time: string, id = `${dayOfWeek}-${time}`): ScheduleSlot => ({ id, dayOfWeek, time, title: id });

describe("nextOccurrence", () => {
  // 2026-11-09 is a Monday. 12:00Z = 19:00 Vietnam time.
  const mondayEvening = new Date("2026-11-09T12:00:00Z");

  it("returns today's slot when it is still ahead (Vietnam time)", () => {
    expect(nextOccurrence(slot(1, "20:00"), mondayEvening).toISOString()).toBe("2026-11-09T13:00:00.000Z");
  });

  it("rolls over to next week when the slot has just started", () => {
    const at = new Date("2026-11-09T13:00:00Z");
    expect(nextOccurrence(slot(1, "20:00"), at).toISOString()).toBe("2026-11-16T13:00:00.000Z");
  });

  it("uses the Vietnam calendar day, not UTC, near midnight", () => {
    // 2026-11-09T18:00Z is already Tuesday 01:00 in Vietnam.
    const lateNight = new Date("2026-11-09T18:00:00Z");
    expect(nextOccurrence(slot(2, "20:00"), lateNight).toISOString()).toBe("2026-11-10T13:00:00.000Z");
  });

  it("handles Sunday (day 0) and early-morning slots before 07:00 VN", () => {
    // Sunday 02:00 VN = Saturday 19:00Z.
    expect(nextOccurrence(slot(0, "02:00"), mondayEvening).toISOString()).toBe("2026-11-14T19:00:00.000Z");
  });
});

describe("nextSlot", () => {
  it("picks the soonest slot", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    const result = nextSlot([slot(3, "20:00", "wed"), slot(2, "20:00", "tue")], now);
    expect(result?.slot.id).toBe("tue");
  });

  it("returns null for an empty schedule", () => {
    expect(nextSlot([], new Date())).toBeNull();
  });
});

describe("isOffDay", () => {
  const slots = [slot(1, "20:00"), slot(4, "22:22")];

  it("is false on a day with a slot", () => {
    expect(isOffDay(slots, new Date("2026-11-09T12:00:00Z"))).toBe(false); // Monday VN
  });

  it("is true on a day without one", () => {
    expect(isOffDay(slots, new Date("2026-11-11T12:00:00Z"))).toBe(true); // Wednesday VN
  });

  it("uses the Vietnam calendar day near midnight", () => {
    // Sunday 18:00Z = Monday 01:00 in Vietnam → a stream day.
    expect(isOffDay(slots, new Date("2026-11-08T18:00:00Z"))).toBe(false);
  });
});
