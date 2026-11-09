import { describe, expect, it } from "vitest";
import { nextVibeIndex, TRIBE_VIBES, vibeIndexForDay } from "./vibes";

describe("TRIBE_VIBES", () => {
  it("has unique ids and non-empty copy", () => {
    const ids = TRIBE_VIBES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const v of TRIBE_VIBES) {
      expect(v.text.length).toBeGreaterThan(20);
      expect(v.tag.length).toBeGreaterThan(0);
    }
  });

  it("cycles deterministically through indices", () => {
    expect(vibeIndexForDay(0, 7)).toBe(0);
    expect(vibeIndexForDay(8, 7)).toBe(1);
    expect(vibeIndexForDay(-1, 7)).toBe(6);
    expect(nextVibeIndex(6, 7)).toBe(0);
    expect(nextVibeIndex(2, 7)).toBe(3);
  });
});

