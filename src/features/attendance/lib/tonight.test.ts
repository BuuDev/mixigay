import { describe, expect, it } from "vitest";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { attendanceDay, shownCount, tonightPlan } from "./tonight";

// 2026-11-12 is a Thursday (4) in Vietnam.
const slots: ScheduleSlot[] = [{ id: "thu", dayOfWeek: 4, time: "22:22", title: "Live tối thứ 5" }];
const vn = (iso: string) => new Date(`${iso}+07:00`);

describe("attendanceDay", () => {
  it("uses the Vietnam calendar day, not UTC", () => {
    expect(attendanceDay(new Date("2026-11-11T16:59:59Z"))).toBe("2026-11-11");
    expect(attendanceDay(new Date("2026-11-11T17:00:00Z"))).toBe("2026-11-12");
  });

  it("rolls over at Vietnam midnight", () => {
    expect(attendanceDay(vn("2026-11-12T23:59:59"))).toBe("2026-11-12");
    expect(attendanceDay(vn("2026-11-13T00:00:00"))).toBe("2026-11-13");
  });

  it("handles month and year ends", () => {
    expect(attendanceDay(new Date("2026-12-31T17:30:00Z"))).toBe("2027-01-01");
  });
});

describe("tonightPlan", () => {
  it("gives today's stream before it starts", () => {
    expect(tonightPlan(slots, [], vn("2026-11-12T20:00:00"))).toEqual({ kind: "stream", dateVn: "2026-11-12", time: "22:22" });
  });

  it("keeps today's stream after it started, until midnight", () => {
    expect(tonightPlan(slots, [], vn("2026-11-12T23:30:00"))).toEqual({ kind: "stream", dateVn: "2026-11-12", time: "22:22" });
  });

  it("is a day off with the next stream on days without one", () => {
    const plan = tonightPlan(slots, [], vn("2026-11-13T10:00:00"));
    expect(plan.kind).toBe("off");
    if (plan.kind === "off") expect(plan.next?.at.toISOString()).toBe(vn("2026-11-19T22:22:00").toISOString());
  });

  it("follows overrides: cancelled day is off, moved time is used", () => {
    const cancelled: ScheduleOverride[] = [{ dateVn: "2026-11-12", cancelled: true }];
    expect(tonightPlan(slots, cancelled, vn("2026-11-12T20:00:00")).kind).toBe("off");
    const moved: ScheduleOverride[] = [{ dateVn: "2026-11-12", cancelled: false, time: "20:00" }];
    expect(tonightPlan(slots, moved, vn("2026-11-12T19:00:00"))).toEqual({ kind: "stream", dateVn: "2026-11-12", time: "20:00" });
    const extra: ScheduleOverride[] = [{ dateVn: "2026-11-13", cancelled: false, time: "21:00" }];
    expect(tonightPlan(slots, extra, vn("2026-11-13T10:00:00"))).toEqual({ kind: "stream", dateVn: "2026-11-13", time: "21:00" });
  });

  it("is off with no next stream when the schedule is empty", () => {
    expect(tonightPlan([], [], vn("2026-11-12T20:00:00"))).toEqual({ kind: "off", dateVn: "2026-11-12", next: null });
  });
});

describe("shownCount", () => {
  it("adds or removes the viewer's own tap relative to the server state", () => {
    expect(shownCount(10, false, true)).toBe(11);
    expect(shownCount(10, true, true)).toBe(10);
    expect(shownCount(10, true, false)).toBe(9);
    expect(shownCount(0, true, false)).toBe(0);
  });
});
