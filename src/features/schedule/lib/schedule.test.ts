import { describe, expect, it } from "vitest";
import { isOffDay, nextOccurrence, nextSlot, prevSlot } from "./schedule";
import type { ScheduleOverride, ScheduleSlot } from "../types";

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

describe("overrides", () => {
  // Monday & Thursday 22:22 VN (15:22Z). 2026-11-09 is a Monday.
  const slots = [slot(1, "22:22", "mon"), slot(4, "22:22", "thu")];
  const mondayNoon = new Date("2026-11-09T05:00:00Z"); // 12:00 VN

  it("matches the plain result when there are no overrides", () => {
    expect(nextSlot(slots, mondayNoon, [])).toEqual(nextSlot(slots, mondayNoon));
    const later = new Date("2026-11-10T02:00:00Z");
    expect(nextSlot(slots, later, [{ dateVn: "2030-01-01", cancelled: true }])).toEqual({ ...nextSlot(slots, later) });
  });

  it("skips a cancelled day", () => {
    const off: ScheduleOverride[] = [{ dateVn: "2026-11-09", cancelled: true, note: "Nghỉ" }];
    const next = nextSlot(slots, mondayNoon, off);
    expect(next?.slot.id).toBe("thu");
    expect(next?.at.toISOString()).toBe("2026-11-12T15:22:00.000Z");
    expect(isOffDay(slots, mondayNoon, off)).toBe(true);
  });

  it("skips several cancelled days in a row", () => {
    const off: ScheduleOverride[] = ["2026-11-09", "2026-11-12", "2026-11-16"].map((dateVn) => ({ dateVn, cancelled: true }));
    expect(nextSlot(slots, mondayNoon, off)?.at.toISOString()).toBe("2026-11-19T15:22:00.000Z");
  });

  it("uses a moved time and reports the override", () => {
    const moved: ScheduleOverride[] = [{ dateVn: "2026-11-09", cancelled: false, time: "20:00", note: "Lên sớm" }];
    const next = nextSlot(slots, mondayNoon, moved);
    expect(next?.at.toISOString()).toBe("2026-11-09T13:00:00.000Z");
    expect(next?.slot).toMatchObject({ id: "mon", time: "20:00" });
    expect(next?.override?.note).toBe("Lên sớm");
  });

  it("moves past an earlier-moved slot once it has started", () => {
    const moved: ScheduleOverride[] = [{ dateVn: "2026-11-09", cancelled: false, time: "20:00" }];
    // 21:00 VN: the moved 20:00 slot already began; the regular 22:22 must not come back.
    expect(nextSlot(slots, new Date("2026-11-09T14:00:00Z"), moved)?.slot.id).toBe("thu");
  });

  it("adds an extra stream on a day off", () => {
    const extra: ScheduleOverride[] = [{ dateVn: "2026-11-11", cancelled: false, time: "21:00", title: "Live bù" }];
    const tuesday = new Date("2026-11-10T05:00:00Z");
    const next = nextSlot(slots, tuesday, extra);
    expect(next?.at.toISOString()).toBe("2026-11-11T14:00:00.000Z");
    expect(next?.slot).toMatchObject({ id: "override-2026-11-11", title: "Live bù", dayOfWeek: 3 });
    expect(isOffDay(slots, new Date("2026-11-11T05:00:00Z"), extra)).toBe(false);
  });

  it("finds an extra stream even without any weekly slot", () => {
    const extra: ScheduleOverride[] = [{ dateVn: "2026-11-20", cancelled: false, time: "21:00" }];
    expect(nextSlot([], mondayNoon, extra)?.at.toISOString()).toBe("2026-11-20T14:00:00.000Z");
    expect(nextSlot([], new Date("2026-11-21T00:00:00Z"), extra)).toBeNull();
  });

  it("finds the previous stream, skipping cancelled days", () => {
    const wednesday = new Date("2026-11-11T05:00:00Z");
    expect(prevSlot(slots, wednesday)?.at.toISOString()).toBe("2026-11-09T15:22:00.000Z");
    expect(prevSlot(slots, wednesday, [{ dateVn: "2026-11-09", cancelled: true }])?.at.toISOString()).toBe("2026-11-05T15:22:00.000Z");
  });
});
