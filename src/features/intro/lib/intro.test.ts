import { describe, expect, it } from "vitest";
import { introKey, markSeen, seenToday } from "./intro";

const now = new Date("2026-11-09T18:00:00Z"); // already 10 Nov in Vietnam

describe("intro once per day", () => {
  it("keys by the Vietnam date", () => expect(introKey(now)).toBe("td.intro.2026-11-10"));

  it("remembers after markSeen", () => {
    const map = new Map<string, string>();
    const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
    expect(seenToday(storage, now)).toBe(false);
    markSeen(storage, now);
    expect(seenToday(storage, now)).toBe(true);
    expect(seenToday(storage, new Date("2026-11-10T18:00:00Z"))).toBe(false);
  });

  it("treats a throwing storage as not seen", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(seenToday(broken, now)).toBe(false);
    expect(() => markSeen(broken, now)).not.toThrow();
  });
});
