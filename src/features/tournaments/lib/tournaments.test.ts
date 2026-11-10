import { describe, expect, it } from "vitest";
import type { Tournament } from "../types";
import { formatDateRange, formatDateVn, groupByStatus } from "./tournaments";

const t = (slug: string, status: Tournament["status"], startsOn: string | null = null, endsOn: string | null = null): Tournament => ({
  slug,
  name: slug,
  kind: "other",
  status,
  startsOn,
  endsOn,
  description: null,
  videoId: null,
  sourceUrl: null,
  results: [],
});

describe("formatDateVn", () => {
  it("reformats a calendar date without shifting time zones", () => {
    expect(formatDateVn("2026-01-01")).toBe("01/01/2026");
    expect(formatDateVn("2026-12-31")).toBe("31/12/2026");
  });
  it("leaves unexpected input untouched", () => {
    expect(formatDateVn("soon")).toBe("soon");
  });
});

describe("formatDateRange", () => {
  it("returns null when no date has been entered", () => {
    expect(formatDateRange(null, null)).toBeNull();
  });
  it("collapses a one-day event", () => {
    expect(formatDateRange("2026-11-10", "2026-11-10")).toBe("10/11/2026");
  });
  it("formats a range and open ends", () => {
    expect(formatDateRange("2026-11-10", "2026-11-12")).toBe("10/11/2026 – 12/11/2026");
    expect(formatDateRange("2026-11-10", null)).toBe("Từ 10/11/2026");
    expect(formatDateRange(null, "2026-11-12")).toBe("Đến 12/11/2026");
  });
});

describe("groupByStatus", () => {
  it("orders groups running → upcoming → finished and drops empty ones", () => {
    const groups = groupByStatus([t("a", "finished"), t("b", "upcoming")]);
    expect(groups.map((g) => g.status)).toEqual(["upcoming", "finished"]);
    expect(groups[0].label).toBe("Sắp tới");
  });
  it("sorts upcoming soonest first with undated last", () => {
    const [g] = groupByStatus([t("undated", "upcoming"), t("late", "upcoming", "2026-12-01"), t("soon", "upcoming", "2026-11-20")]);
    expect(g.items.map((x) => x.slug)).toEqual(["soon", "late", "undated"]);
  });
  it("sorts finished latest first", () => {
    const [g] = groupByStatus([t("old", "finished", "2026-01-01", "2026-01-02"), t("new", "finished", "2026-10-01", "2026-10-03")]);
    expect(g.items.map((x) => x.slug)).toEqual(["new", "old"]);
  });
  it("returns no groups for an empty list", () => {
    expect(groupByStatus([])).toEqual([]);
  });
});
