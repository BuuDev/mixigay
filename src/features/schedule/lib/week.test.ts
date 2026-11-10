import { describe, expect, it } from "vitest";
import type { ScheduleOverride, ScheduleSlot } from "../types";
import { nextSlot } from "./schedule";
import { nextRowKey, weekRows, weekStart } from "./week";

const slot = (dayOfWeek: number, time: string, id = `${dayOfWeek}`): ScheduleSlot => ({ id, dayOfWeek, time, title: `slot ${id}` });
const slots = [slot(1, "22:22"), slot(4, "22:22"), slot(6, "23:00")]; // Mon, Thu, Sat
const wednesday = new Date("2026-11-11T05:00:00Z"); // Wed 11 Nov, 12:00 VN

describe("weekStart", () => {
  it("is the Vietnam Monday", () => {
    expect(weekStart(wednesday).toISOString()).toBe("2026-11-09T00:00:00.000Z");
    // Sunday 23:30 VN still belongs to the week starting Monday 9 Nov.
    expect(weekStart(new Date("2026-11-15T16:30:00Z")).toISOString()).toBe("2026-11-09T00:00:00.000Z");
  });
});

describe("weekRows", () => {
  it("lists the regular week without overrides", () => {
    const rows = weekRows(slots, wednesday);
    expect(rows.map((r) => [r.dateVn, r.kind])).toEqual([
      ["2026-11-09", "regular"],
      ["2026-11-12", "regular"],
      ["2026-11-14", "regular"],
    ]);
    expect(rows[1].at.toISOString()).toBe("2026-11-12T15:22:00.000Z");
  });

  it("applies this week's overrides and ignores other weeks", () => {
    const overrides: ScheduleOverride[] = [
      { dateVn: "2026-11-12", cancelled: true, note: "Nghỉ" },
      { dateVn: "2026-11-14", cancelled: false, time: "21:00" },
      { dateVn: "2026-11-13", cancelled: false, time: "20:00", title: "Live bù" },
      { dateVn: "2026-11-19", cancelled: true },
    ];
    const rows = weekRows(slots, wednesday, overrides);
    expect(rows.map((r) => [r.dateVn, r.kind, r.slot.time])).toEqual([
      ["2026-11-09", "regular", "22:22"],
      ["2026-11-12", "cancelled", "22:22"],
      ["2026-11-13", "extra", "20:00"],
      ["2026-11-14", "changed", "21:00"],
    ]);
    expect(rows[1].override?.note).toBe("Nghỉ");
    expect(rows[3].original?.time).toBe("23:00");
  });
});

describe("nextRowKey", () => {
  it("skips a cancelled row and badges the next real stream", () => {
    const overrides: ScheduleOverride[] = [{ dateVn: "2026-11-12", cancelled: true }];
    const rows = weekRows(slots, wednesday, overrides);
    expect(nextRowKey(rows, nextSlot(slots, wednesday, overrides))).toBe("2026-11-14-6");
  });

  it("falls back to the weekly row when the next stream is next week", () => {
    const sunday = new Date("2026-11-15T05:00:00Z");
    const rows = weekRows(slots, sunday);
    expect(nextRowKey(rows, nextSlot(slots, sunday))).toBe("2026-11-09-1");
  });

  it("is undefined without a next stream", () => {
    expect(nextRowKey([], null)).toBeUndefined();
  });
});
