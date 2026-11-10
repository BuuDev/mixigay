import { describe, expect, it } from "vitest";
import {
  appendGuestHistory,
  GUEST_HISTORY_KEY,
  GUEST_KEY,
  markBadgesSeen,
  parseGuestHistory,
  readGuestHistory,
  readGuestHistoryRaw,
  readSeenBadges,
  SEEN_BADGES_KEY,
} from "./guest-storage";

function memory(init: Record<string, string> = {}) {
  const data = new Map(Object.entries(init));
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, String(v)) };
}

const throwing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("guest history", () => {
  it("appends days in order without duplicates", () => {
    const s = memory();
    expect(appendGuestHistory(s, "2026-11-12")).toBe(true);
    expect(appendGuestHistory(s, "2026-11-10")).toBe(true);
    expect(appendGuestHistory(s, "2026-11-12")).toBe(true);
    expect(readGuestHistory(s)).toEqual(["2026-11-10", "2026-11-12"]);
  });

  it("includes the single-day tap stored before history existed", () => {
    const s = memory({ [GUEST_KEY]: "2026-11-09", [GUEST_HISTORY_KEY]: '["2026-11-10"]' });
    expect(readGuestHistory(s)).toEqual(["2026-11-09", "2026-11-10"]);
    expect(parseGuestHistory(readGuestHistoryRaw(s), "2026-11-09")).toEqual(["2026-11-09", "2026-11-10"]);
  });

  it("ignores junk", () => {
    expect(readGuestHistory(memory({ [GUEST_HISTORY_KEY]: "{oops" }))).toEqual([]);
    expect(readGuestHistory(memory({ [GUEST_HISTORY_KEY]: '[1,"x","2026-11-10"]' }))).toEqual(["2026-11-10"]);
    expect(appendGuestHistory(memory(), "tomorrow")).toBe(false);
    expect(parseGuestHistory("", null)).toEqual([]);
  });

  it("caps the stored history", () => {
    const s = memory();
    const days = Array.from({ length: 1005 }, (_, i) => new Date(Date.UTC(2023, 0, 1 + i)).toISOString().slice(0, 10));
    s.setItem(GUEST_HISTORY_KEY, JSON.stringify(days));
    appendGuestHistory(s, "2026-11-10");
    const stored = JSON.parse(s.getItem(GUEST_HISTORY_KEY) ?? "[]") as string[];
    expect(stored).toHaveLength(1000);
    expect(stored.at(-1)).toBe("2026-11-10");
  });

  it("survives missing or throwing storage", () => {
    expect(readGuestHistory(null)).toEqual([]);
    expect(readGuestHistory(throwing)).toEqual([]);
    expect(readGuestHistoryRaw(throwing)).toBe("");
    expect(appendGuestHistory(throwing, "2026-11-10")).toBe(false);
    expect(appendGuestHistory(null, "2026-11-10")).toBe(false);
  });
});

describe("seen badges", () => {
  it("remembers celebrated badges once per device", () => {
    const s = memory();
    expect(readSeenBadges(s)).toEqual([]);
    expect(markBadgesSeen(s, ["tan-binh"])).toBe(true);
    expect(markBadgesSeen(s, ["tan-binh", "chien-binh"])).toBe(true);
    expect(readSeenBadges(s)).toEqual(["tan-binh", "chien-binh"]);
    expect(JSON.parse(s.getItem(SEEN_BADGES_KEY) ?? "")).toHaveLength(2);
  });

  it("survives missing or throwing storage", () => {
    expect(readSeenBadges(throwing)).toEqual([]);
    expect(markBadgesSeen(throwing, ["tan-binh"])).toBe(false);
    expect(markBadgesSeen(null, ["tan-binh"])).toBe(false);
  });
});
