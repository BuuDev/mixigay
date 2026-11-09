import { describe, expect, it } from "vitest";
import type { ScheduleOverride, ScheduleSlot } from "../types";
import { EXTRA_STREAM_TITLE, effectiveSlots, instantOn, isChange, upcomingOverrides, vnDateKey, vnDay } from "./overrides";

const slot = (dayOfWeek: number, time: string, id = `${dayOfWeek}`): ScheduleSlot => ({ id, dayOfWeek, time, title: `slot ${id}`, gameSlug: "gta-v" });
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const slots = [slot(1, "22:22"), slot(4, "22:22")]; // Monday, Thursday

describe("vnDay / vnDateKey", () => {
  it("uses the Vietnam calendar day", () => {
    expect(vnDateKey(new Date("2026-11-09T16:59:00Z"))).toBe("2026-11-09");
    expect(vnDateKey(new Date("2026-11-09T17:00:00Z"))).toBe("2026-11-10");
    expect(vnDay(new Date("2026-11-09T17:00:00Z")).toISOString()).toBe("2026-11-10T00:00:00.000Z");
  });
});

describe("effectiveSlots", () => {
  it("returns the regular slots without an override", () => {
    expect(effectiveSlots(slots, day(2026, 11, 12))).toEqual([slots[1]]);
    expect(effectiveSlots(slots, day(2026, 11, 11), [])).toEqual([]);
  });

  it("drops every slot on a cancelled day", () => {
    expect(effectiveSlots(slots, day(2026, 11, 12), [{ dateVn: "2026-11-12", cancelled: true }])).toEqual([]);
  });

  it("only affects the matching date", () => {
    expect(effectiveSlots(slots, day(2026, 11, 19), [{ dateVn: "2026-11-12", cancelled: true }])).toEqual([slots[1]]);
  });

  it("moves the time and keeps the regular title, id and game", () => {
    const [s] = effectiveSlots(slots, day(2026, 11, 12), [{ dateVn: "2026-11-12", cancelled: false, time: "20:00" }]);
    expect(s).toMatchObject({ id: "4", time: "20:00", title: "slot 4", gameSlug: "gta-v", dayOfWeek: 4 });
  });

  it("replaces the title only", () => {
    const [s] = effectiveSlots(slots, day(2026, 11, 12), [{ dateVn: "2026-11-12", cancelled: false, title: "Live từ thiện" }]);
    expect(s).toMatchObject({ time: "22:22", title: "Live từ thiện" });
  });

  it("adds an extra stream on a day without a weekly slot", () => {
    const [s] = effectiveSlots(slots, day(2026, 11, 11), [{ dateVn: "2026-11-11", cancelled: false, time: "21:00" }]);
    expect(s).toMatchObject({ id: "override-2026-11-11", time: "21:00", title: EXTRA_STREAM_TITLE, dayOfWeek: 3 });
  });

  it("cannot place a stream from a title alone on an empty day", () => {
    expect(effectiveSlots(slots, day(2026, 11, 11), [{ dateVn: "2026-11-11", cancelled: false, title: "x" }])).toEqual([]);
  });

  it("leaves the day unchanged for a note-only override", () => {
    const o: ScheduleOverride = { dateVn: "2026-11-12", cancelled: false, note: "Có thể muộn" };
    expect(isChange(o)).toBe(false);
    expect(effectiveSlots(slots, day(2026, 11, 12), [o])).toEqual([slots[1]]);
  });
});

describe("instantOn", () => {
  it("converts Vietnam time to UTC", () => {
    expect(instantOn(day(2026, 11, 12), "22:22").toISOString()).toBe("2026-11-12T15:22:00.000Z");
  });
});

describe("upcomingOverrides", () => {
  const list: ScheduleOverride[] = [
    { dateVn: "2026-12-01", cancelled: true },
    { dateVn: "2026-11-08", cancelled: true },
    { dateVn: "2026-11-09", cancelled: true },
  ];
  it("keeps today and later, sorted", () => {
    expect(upcomingOverrides(list, new Date("2026-11-09T12:00:00Z")).map((o) => o.dateVn)).toEqual(["2026-11-09", "2026-12-01"]);
  });
  it("limits the window", () => {
    expect(upcomingOverrides(list, new Date("2026-11-09T12:00:00Z"), 7).map((o) => o.dateVn)).toEqual(["2026-11-09"]);
  });
});
