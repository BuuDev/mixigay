import { describe, expect, it } from "vitest";
import { GUEST_KEY, guestAttended, markGuestAttended, readGuestDay, safeStorage } from "./guest-storage";

function memory(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

const throwing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("guest attendance storage", () => {
  it("remembers a tap for that Vietnam day only", () => {
    const s = memory();
    expect(guestAttended(s, "2026-11-12")).toBe(false);
    expect(markGuestAttended(s, "2026-11-12")).toBe(true);
    expect(s.getItem(GUEST_KEY)).toBe("2026-11-12");
    expect(guestAttended(s, "2026-11-12")).toBe(true);
    expect(guestAttended(s, "2026-11-13")).toBe(false);
  });

  it("ignores junk values", () => {
    const s = memory();
    s.setItem(GUEST_KEY, "yes");
    expect(readGuestDay(s)).toBeNull();
    expect(guestAttended(s, "2026-11-12")).toBe(false);
  });

  it("works when storage throws", () => {
    expect(readGuestDay(throwing)).toBeNull();
    expect(guestAttended(throwing, "2026-11-12")).toBe(false);
    expect(markGuestAttended(throwing, "2026-11-12")).toBe(false);
  });

  it("works without storage", () => {
    expect(readGuestDay(null)).toBeNull();
    expect(markGuestAttended(null, "2026-11-12")).toBe(false);
  });

  it("safeStorage returns null when localStorage is unavailable or throws", () => {
    const g = globalThis as { window?: unknown };
    const saved = g.window;
    try {
      delete g.window;
      expect(safeStorage()).toBeNull();
      g.window = Object.defineProperty({}, "localStorage", {
        get() {
          throw new Error("SecurityError");
        },
      });
      expect(safeStorage()).toBeNull();
    } finally {
      if (saved === undefined) delete g.window;
      else g.window = saved;
    }
  });
});
