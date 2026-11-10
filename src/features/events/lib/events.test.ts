import { describe, expect, it } from "vitest";
import { ANNUAL_EVENTS, daysUntilAnnual, isCharityMonth, OPEN_EVENTS } from "./events";

describe("daysUntilAnnual", () => {
  it("counts down to 1 December from 9 November", () => {
    expect(daysUntilAnnual(12, 1, new Date("2026-11-09T05:00:00Z")).days).toBe(22);
  });
  it("is 0 on the day itself (Vietnam time)", () => {
    expect(daysUntilAnnual(9, 12, new Date("2026-09-11T18:00:00Z")).days).toBe(0); // 01:00 on 12/09 in Vietnam
  });
  it("rolls to next year once passed", () => {
    const r = daysUntilAnnual(9, 12, new Date("2026-11-09T05:00:00Z"));
    expect(r.date.toISOString().slice(0, 10)).toBe("2027-09-12");
  });
});

describe("isCharityMonth", () => {
  it("follows the Vietnam calendar", () => {
    expect(isCharityMonth(new Date("2026-11-30T17:30:00Z"))).toBe(true); // 1 Dec in Vietnam
    expect(isCharityMonth(new Date("2026-11-30T16:00:00Z"))).toBe(false);
  });
});

describe("event data", () => {
  it("cites https sources", () => {
    for (const e of [...ANNUAL_EVENTS, ...OPEN_EVENTS]) expect(new URL(e.source.href).protocol, e.id).toBe("https:");
  });
});
