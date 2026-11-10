import { describe, expect, it } from "vitest";
import type { ScheduleOverride, ScheduleSlot } from "../types";
import { countdownProgress, googleCalendarLink, monthGrid, slotInstant, vnDate } from "./calendar";

const slot = (dayOfWeek: number, time: string): ScheduleSlot => ({ id: `${dayOfWeek}`, dayOfWeek, time, title: "t" });

describe("vnDate", () => {
  it("rolls to the next day after 17:00 UTC", () => {
    expect(vnDate(new Date("2026-11-09T17:30:00Z"))).toEqual({ y: 2026, m: 10, d: 10 });
  });
});

describe("monthGrid", () => {
  const now = new Date("2026-11-09T12:00:00Z"); // Monday 9 Nov, Vietnam
  const weeks = monthGrid(2026, 10, [slot(4, "22:22")], now);

  it("starts on Monday and covers the whole month", () => {
    expect(weeks[0][0].date.getUTCDay()).toBe(1);
    const inMonth = weeks.flat().filter((c) => c.inMonth);
    expect(inMonth).toHaveLength(30);
    expect(inMonth[0].date.getUTCDate()).toBe(1);
  });

  it("marks today and stream days", () => {
    const today = weeks.flat().find((c) => c.isToday)!;
    expect(today.date.getUTCDate()).toBe(9);
    const thursday = weeks.flat().find((c) => c.inMonth && c.date.getUTCDate() === 12)!;
    expect(thursday.slots).toHaveLength(1);
    expect(today.slots).toHaveLength(0);
  });
});

describe("monthGrid with overrides", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  const overrides: ScheduleOverride[] = [
    { dateVn: "2026-11-12", cancelled: true, note: "Nghỉ đột xuất" },
    { dateVn: "2026-11-19", cancelled: false, time: "20:00" },
    { dateVn: "2026-11-18", cancelled: false, time: "21:00", title: "Live bù" },
  ];
  const cells = monthGrid(2026, 10, [slot(4, "22:22")], now, overrides).flat();
  const on = (d: number) => cells.find((c) => c.inMonth && c.date.getUTCDate() === d)!;

  it("marks a cancelled day with no slots and keeps the note", () => {
    expect(on(12).slots).toHaveLength(0);
    expect(on(12).override).toMatchObject({ cancelled: true, note: "Nghỉ đột xuất" });
  });

  it("shows a moved time and an extra day", () => {
    expect(on(19).slots.map((s) => s.time)).toEqual(["20:00"]);
    expect(on(19).override?.time).toBe("20:00");
    expect(on(18).slots.map((s) => s.title)).toEqual(["Live bù"]);
  });

  it("leaves other days alone", () => {
    expect(on(26).slots.map((s) => s.time)).toEqual(["22:22"]);
    expect(on(26).override).toBeUndefined();
  });
});

describe("slotInstant", () => {
  it("converts a Vietnam-time slot to UTC", () => {
    expect(slotInstant(new Date(Date.UTC(2026, 10, 12)), slot(4, "22:22")).toISOString()).toBe("2026-11-12T15:22:00.000Z");
  });
});

describe("countdownProgress", () => {
  const slots = [slot(1, "20:00"), slot(4, "20:00")]; // Mon & Thu 13:00Z
  it("is 0 right after a stream starts and grows toward the next", () => {
    expect(countdownProgress(slots, new Date("2026-11-09T13:00:01Z"))).toBeLessThan(0.001);
    const mid = countdownProgress(slots, new Date("2026-11-11T01:00:00Z")); // halfway Mon 13:00 → Thu 13:00
    expect(mid).toBeCloseTo(0.5, 2);
  });
  it("is 0 without slots", () => expect(countdownProgress([], new Date())).toBe(0));
  it("matches the plain result when overrides do not touch the window", () => {
    const at = new Date("2026-11-11T01:00:00Z");
    expect(countdownProgress(slots, at, [{ dateVn: "2030-01-01", cancelled: true }])).toBeCloseTo(countdownProgress(slots, at), 6);
  });
  it("stretches the wait across a cancelled day", () => {
    // Thu 12 Nov cancelled: Mon 9 13:00Z → Mon 16 13:00Z; Fri 13 01:00Z is 3.5 of 7 days.
    const p = countdownProgress(slots, new Date("2026-11-13T01:00:00Z"), [{ dateVn: "2026-11-12", cancelled: true }]);
    expect(p).toBeCloseTo(0.5, 2);
  });
});

describe("googleCalendarLink", () => {
  it("builds a template link with UTC times", () => {
    const url = new URL(googleCalendarLink({ title: "Độ live", start: new Date("2026-11-12T15:22:00Z"), minutes: 60 }));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261112T152200Z/20261112T162200Z");
    expect(url.searchParams.get("text")).toBe("Độ live");
  });
});
