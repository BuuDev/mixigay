import { describe, expect, it } from "vitest";
import { daysSince, GHOST_PROJECTS } from "./ghost-projects";

describe("daysSince", () => {
  it("counts Vietnam calendar days", () => {
    expect(daysSince("2026-11-08", new Date("2026-11-09T12:00:00Z"))).toBe(1);
    // 17:30Z on the 8th is already the 9th in Vietnam.
    expect(daysSince("2026-11-08", new Date("2026-11-08T17:30:00Z"))).toBe(1);
    expect(daysSince("2026-11-08", new Date("2026-11-08T10:00:00Z"))).toBe(0);
  });
  it("never goes negative", () => expect(daysSince("2026-12-01", new Date("2026-11-09T00:00:00Z"))).toBe(0));
});

describe("GHOST_PROJECTS", () => {
  it("cites a YouTube video id and a valid date for each", () => {
    for (const p of GHOST_PROJECTS) {
      expect(p.videoId, p.id).toMatch(/^[\w-]{11}$/);
      expect(Number.isNaN(Date.parse(p.announcedAt)), p.id).toBe(false);
    }
  });
  it("has unique ids", () => expect(new Set(GHOST_PROJECTS.map((p) => p.id)).size).toBe(GHOST_PROJECTS.length));
  it("carries no invented progress field (owner's decision: real day counter)", () => {
    for (const p of GHOST_PROJECTS) expect(Object.keys(p)).not.toContain("progress");
  });
});
