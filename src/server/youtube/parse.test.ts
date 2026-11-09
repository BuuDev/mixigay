import { describe, expect, it } from "vitest";
import { parseIsoDuration, parseRssVideoIds, uploadsPlaylistId } from "./parse";

describe("parseIsoDuration", () => {
  it.each([
    ["PT2H13M5S", 2 * 3600 + 13 * 60 + 5],
    ["PT45S", 45],
    ["PT10M", 600],
    ["P1DT2H", 26 * 3600],
    ["P0D", 0],
  ])("%s → %d", (iso, seconds) => {
    expect(parseIsoDuration(iso)).toBe(seconds);
  });

  it("returns 0 for missing or malformed input", () => {
    expect(parseIsoDuration(undefined)).toBe(0);
    expect(parseIsoDuration("2 hours")).toBe(0);
  });
});

describe("parseRssVideoIds", () => {
  it("extracts ids in feed order", () => {
    const xml = `<feed><entry><yt:videoId>abcDEF12345</yt:videoId></entry><entry><yt:videoId>a-b_c-d_e-f</yt:videoId></entry></feed>`;
    expect(parseRssVideoIds(xml)).toEqual(["abcDEF12345", "a-b_c-d_e-f"]);
  });

  it("returns nothing for an empty feed", () => {
    expect(parseRssVideoIds("<feed></feed>")).toEqual([]);
  });
});

describe("uploadsPlaylistId", () => {
  it("swaps the UC prefix for UU", () => {
    expect(uploadsPlaylistId("UCabc")).toBe("UUabc");
  });

  it("rejects ids that are not channel ids", () => {
    expect(() => uploadsPlaylistId("PLabc")).toThrow();
  });
});
