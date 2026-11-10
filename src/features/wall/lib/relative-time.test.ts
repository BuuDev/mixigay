import { describe, expect, it } from "vitest";
import { relativeTime } from "./relative-time";

const now = new Date("2026-11-10T12:00:00Z");

describe("relativeTime", () => {
  it("buckets recent times", () => {
    expect(relativeTime("2026-11-10T11:59:30Z", now)).toBe("vừa xong");
    expect(relativeTime("2026-11-10T11:55:00Z", now)).toBe("5 phút trước");
    expect(relativeTime("2026-11-10T09:00:00Z", now)).toBe("3 giờ trước");
    expect(relativeTime("2026-11-08T12:00:00Z", now)).toBe("2 ngày trước");
  });
  it("treats future times (clock skew) as just now", () => {
    expect(relativeTime("2026-11-10T12:05:00Z", now)).toBe("vừa xong");
  });
  it("falls back to a date for old messages and to empty for bad input", () => {
    expect(relativeTime("2026-01-01T12:00:00Z", now)).toMatch(/2026/);
    expect(relativeTime("not a date", now)).toBe("");
  });
});
