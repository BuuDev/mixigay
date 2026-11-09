import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatClock, formatCount, formatDayKey, formatElapsed, formatLength, formatVnDate, formatVnDateTime, streamDayOf } from "./vn-time";

function suite() {
  it("maps an evening start to the same Vietnam day", () => {
    // 2026-11-07 13:05Z = Saturday 20:05 in Vietnam.
    expect(streamDayOf("2026-11-07T13:05:00Z")).toEqual({ key: "2026-11-07", index: expect.any(Number), weekday: 6, minute: 20 * 60 + 5 });
  });

  it("counts an after-midnight start as the evening before", () => {
    // 2026-11-07 17:30Z = Sunday 00:30 in Vietnam → still Saturday's stream night, 24:30.
    const d = streamDayOf("2026-11-07T17:30:00Z");
    expect(d.key).toBe("2026-11-07");
    expect(d.weekday).toBe(6);
    expect(d.minute).toBe(24 * 60 + 30);
  });

  it("starts a new stream day at 06:00 Vietnam time", () => {
    const before = streamDayOf("2026-11-07T22:59:00Z"); // Sun 05:59 VN
    const after = streamDayOf("2026-11-07T23:00:00Z"); // Sun 06:00 VN
    expect(before.key).toBe("2026-11-07");
    expect(after.key).toBe("2026-11-08");
    expect(after.weekday).toBe(0);
    expect(after.minute).toBe(360);
    expect(after.index - before.index).toBe(1);
  });

  it("gives consecutive indexes across a month and year boundary", () => {
    const a = streamDayOf("2026-12-31T13:00:00Z");
    const b = streamDayOf("2027-01-01T13:00:00Z");
    expect(a.key).toBe("2026-12-31");
    expect(b.key).toBe("2027-01-01");
    expect(b.index - a.index).toBe(1);
  });

  it("formats clock times, wrapping past midnight", () => {
    expect(formatClock(20 * 60 + 5)).toBe("20:05");
    expect(formatClock(24 * 60 + 30)).toBe("00:30");
    expect(formatClock(0)).toBe("00:00");
  });

  it("formats lengths in Vietnamese", () => {
    expect(formatLength(45)).toBe("45 phút");
    expect(formatLength(245)).toBe("4 giờ 05 phút");
    expect(formatLength(120)).toBe("2 giờ");
    expect(formatLength(-3)).toBe("0 phút");
  });

  it("formats Vietnam dates and times", () => {
    expect(formatVnDate("2026-11-07T17:30:00Z")).toBe("CN 08/11/2026");
    expect(formatVnDate("2026-11-07T13:05:00Z")).toBe("T7 07/11/2026");
    expect(formatVnDateTime("2026-11-07T13:05:00Z")).toBe("07/11 20:05");
    expect(formatDayKey("2026-11-07")).toBe("07/11/2026");
  });

  it("formats elapsed time and counts", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(95)).toBe("1:35");
    expect(formatCount(48213)).toBe("48.213");
  });
}

describe("vn-time", suite);

describe("vn-time under another server time zone", () => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "America/Los_Angeles";
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });
  suite();
});
