import { describe, expect, it } from "vitest";
import type { ScheduleSlot } from "../types";
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
});

describe("googleCalendarLink", () => {
  it("builds a template link with UTC times", () => {
    const url = new URL(googleCalendarLink({ title: "Độ live", start: new Date("2026-11-12T15:22:00Z"), minutes: 60 }));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261112T152200Z/20261112T162200Z");
    expect(url.searchParams.get("text")).toBe("Độ live");
  });
});
