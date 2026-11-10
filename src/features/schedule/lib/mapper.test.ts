import { describe, expect, it } from "vitest";
import { mapOverride, mapOverrides, mapSlot, type ScheduleOverrideRow } from "./mapper";

const row = (r: Partial<ScheduleOverrideRow>): ScheduleOverrideRow => ({
  date_vn: "2026-11-12",
  cancelled: false,
  time_vn: null,
  title: null,
  note: null,
  ...r,
});

describe("mapSlot", () => {
  it("trims seconds from the time", () => {
    expect(mapSlot({ id: "a", day_of_week: 1, time_vn: "22:22:00", title: "t", game_slug: null, note: null }).time).toBe("22:22");
  });
});

describe("mapOverride", () => {
  it("maps a moved slot", () => {
    expect(mapOverride(row({ time_vn: "20:00:00", title: " Live sớm ", note: "" }))).toEqual({
      dateVn: "2026-11-12",
      cancelled: false,
      time: "20:00",
      title: "Live sớm",
      note: undefined,
    });
  });

  it("maps a cancelled day", () => {
    expect(mapOverride(row({ cancelled: true, note: "Nghỉ" }))).toMatchObject({ cancelled: true, time: undefined, note: "Nghỉ" });
  });

  it("rejects bad dates and times", () => {
    expect(mapOverride(row({ date_vn: "12/11/2026" }))).toBeNull();
    expect(mapOverride(row({ time_vn: "25:00:00" }))).toBeNull();
  });

  it("drops invalid rows from a list", () => {
    expect(mapOverrides([row({}), row({ date_vn: "bad" })])).toHaveLength(1);
  });
});
