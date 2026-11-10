import { describe, expect, it } from "vitest";
import { FALLBACK_MS, MAX_RETRY_MS, MAX_SLEEP_MS, RETRY_MS, SETTLE_MS, SPREAD_MS, refreshDelay } from "./refresh";

const now = Date.parse("2026-11-09T12:00:00Z");

describe("refreshDelay", () => {
  it("sleeps until just after the server's next check", () => {
    expect(refreshDelay("2026-11-09T12:50:00Z", now, 0)).toBe(50 * 60_000 + SETTLE_MS);
  });

  it("spreads a crowd over a minute", () => {
    const a = refreshDelay("2026-11-09T12:50:00Z", now, 0);
    const b = refreshDelay("2026-11-09T12:50:00Z", now, 0.999);
    expect(b - a).toBeGreaterThan(SPREAD_MS - 100);
    expect(b - a).toBeLessThan(SPREAD_MS);
  });

  it("retries in 2 minutes when the plan is already past, then backs off while it stays past", () => {
    const past = "2026-11-09T11:00:00Z";
    expect(refreshDelay(past, now, 0)).toBe(RETRY_MS);
    expect(refreshDelay(past, now, 0, 1)).toBe(2 * RETRY_MS);
    expect(refreshDelay(past, now, 0, 3)).toBe(8 * RETRY_MS);
    expect(refreshDelay(past, now, 0, 10)).toBe(MAX_RETRY_MS);
  });

  it("falls back to a slow read without a plan", () => {
    expect(refreshDelay(undefined, now, 0)).toBe(FALLBACK_MS);
    expect(refreshDelay("not a date", now, 0)).toBe(FALLBACK_MS);
  });

  it("a visible tab never sleeps longer than 2 hours", () => {
    expect(refreshDelay("2026-11-09T20:00:00Z", now, 0)).toBe(MAX_SLEEP_MS);
  });
});
