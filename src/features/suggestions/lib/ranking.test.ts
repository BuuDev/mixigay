import { describe, expect, it } from "vitest";
import type { Suggestion } from "../types";
import { ageHours, FAN_BOOST, FRESH_BOOST, hotScore, LINEUP_SIZE, parseSortMode, risingIds, sortSuggestions, tonightLineup } from "./ranking";

const NOW = Date.parse("2026-11-10T12:00:00Z");
const HOUR = 3_600_000;

let seq = 0;
function sug(over: Partial<Suggestion> & { hoursAgo?: number } = {}): Suggestion {
  const { hoursAgo = 24 * 10, ...rest } = over;
  seq += 1;
  return {
    id: `s${seq}`,
    name: `Game ${seq}`,
    source: "steam",
    reason: "vui",
    author: "fan",
    createdAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
    upvotes: 0,
    status: "pending",
    ...rest,
  };
}

const ids = (list: { id: string }[]) => list.map((s) => s.id);
const pickIds = (list: { suggestion: Suggestion }[]) => list.map((p) => p.suggestion.id);

describe("hotScore", () => {
  it("is 0 for played and rejected suggestions", () => {
    expect(hotScore(sug({ upvotes: 999, status: "played", hoursAgo: 1 }), NOW)).toBe(0);
    expect(hotScore(sug({ upvotes: 999, status: "rejected", hoursAgo: 1 }), NOW)).toBe(0);
  });

  it("grows with votes and decays with age", () => {
    expect(hotScore(sug({ upvotes: 10, hoursAgo: 100 }), NOW)).toBeGreaterThan(hotScore(sug({ upvotes: 5, hoursAgo: 100 }), NOW));
    expect(hotScore(sug({ upvotes: 10, hoursAgo: 100 }), NOW)).toBeGreaterThan(hotScore(sug({ upvotes: 10, hoursAgo: 200 }), NOW));
  });

  it("applies the fan-made and fresh boosts", () => {
    const plain = hotScore(sug({ upvotes: 10, hoursAgo: 100 }), NOW);
    expect(hotScore(sug({ upvotes: 10, hoursAgo: 100, source: "viewer-made" }), NOW)).toBeCloseTo(plain * FAN_BOOST);
    const old = sug({ upvotes: 10, hoursAgo: 72 });
    const fresh = sug({ upvotes: 10, hoursAgo: 71.99 });
    expect(hotScore(fresh, NOW) / hotScore(old, NOW)).toBeCloseTo(FRESH_BOOST, 2);
  });

  it("treats future timestamps as age 0 and survives a bad date", () => {
    expect(ageHours(sug({ hoursAgo: -5 }), NOW)).toBe(0);
    expect(Number.isFinite(hotScore(sug({ createdAt: "not a date" }), NOW))).toBe(true);
  });
});

describe("old famous game vs new fan game", () => {
  const famous = sug({ id: "famous", upvotes: 500, hoursAgo: 24 * 30 });
  const fan = sug({ id: "fan", upvotes: 8, hoursAgo: 2, source: "viewer-made" });

  it("puts the new fan game above the 30-day-old 500-vote game in hot", () => {
    expect(ids(sortSuggestions([famous, fan], "hot", NOW))).toEqual(["fan", "famous"]);
  });

  it("keeps the famous game on top in 'top'", () => {
    expect(ids(sortSuggestions([fan, famous], "top", NOW))).toEqual(["famous", "fan"]);
  });

  it("lets the famous game win while it is fresh too, and the fan game take over once it ages", () => {
    // Both posted at the same time: 500 votes beat 8.
    const famousFresh = { ...famous, createdAt: fan.createdAt };
    expect(ids(sortSuggestions([fan, famousFresh], "hot", NOW))).toEqual(["famous", "fan"]);
    // Find how old the famous game must be before the 2-hour-old fan game passes it.
    let crossover = -1;
    for (let h = 2; h <= 24 * 60; h += 1) {
      const aged = { ...famous, createdAt: new Date(NOW - h * HOUR).toISOString() };
      if (hotScore(fan, NOW) > hotScore(aged, NOW)) {
        crossover = h;
        break;
      }
    }
    expect(crossover).toBeGreaterThan(24); // a day-old 500-vote game is still hotter
    expect(crossover).toBeLessThan(24 * 30); // but not forever
  });

  it("always has the fan game in tonight's lineup", () => {
    const others = Array.from({ length: 8 }, (_, i) => sug({ upvotes: 300 - i * 10, hoursAgo: 24 * (5 + i) }));
    const lineup = tonightLineup([famous, ...others, fan], NOW);
    expect(pickIds(lineup)).toContain("fan");
    expect(lineup).toHaveLength(LINEUP_SIZE);
  });
});

describe("sortSuggestions", () => {
  it("is deterministic on ties: newer first, then id", () => {
    const a = sug({ id: "b", upvotes: 3, hoursAgo: 50 });
    const b = sug({ id: "a", upvotes: 3, hoursAgo: 50 });
    const c = sug({ id: "c", upvotes: 3, hoursAgo: 40 });
    expect(ids(sortSuggestions([a, b, c], "hot", NOW))).toEqual(["c", "a", "b"]);
    expect(ids(sortSuggestions([a, b, c], "top", NOW))).toEqual(["c", "a", "b"]);
    expect(ids(sortSuggestions([b, c, a], "new", NOW))).toEqual(["c", "a", "b"]);
  });

  it("puts played/rejected after every pending suggestion in hot", () => {
    const played = sug({ id: "played", upvotes: 9999, status: "played", hoursAgo: 1 });
    const rejected = sug({ id: "rejected", upvotes: 9999, status: "rejected", hoursAgo: 2 });
    const weak = sug({ id: "weak", upvotes: 0, hoursAgo: 24 * 90 });
    expect(ids(sortSuggestions([played, weak, rejected], "hot", NOW))).toEqual(["weak", "played", "rejected"]);
  });

  it("'new' is createdAt desc regardless of votes", () => {
    const old = sug({ id: "old", upvotes: 900, hoursAgo: 300 });
    const mid = sug({ id: "mid", upvotes: 1, hoursAgo: 30, status: "played" });
    const fresh = sug({ id: "fresh", upvotes: 0, hoursAgo: 1 });
    expect(ids(sortSuggestions([old, mid, fresh], "new", NOW))).toEqual(["fresh", "mid", "old"]);
  });

  it("'fan' keeps only fan-made games, in hot order", () => {
    const f1 = sug({ id: "f1", source: "viewer-made", upvotes: 50, hoursAgo: 24 * 20 });
    const f2 = sug({ id: "f2", source: "viewer-made", upvotes: 20, hoursAgo: 5 });
    const s = sug({ id: "steam", upvotes: 999, hoursAgo: 1 });
    expect(ids(sortSuggestions([f1, s, f2], "fan", NOW))).toEqual(["f2", "f1"]);
  });

  it("does not mutate its input and handles an empty list", () => {
    const list = [sug({ id: "x", upvotes: 1 }), sug({ id: "y", upvotes: 5 })];
    sortSuggestions(list, "top", NOW);
    expect(ids(list)).toEqual(["x", "y"]);
    expect(sortSuggestions([], "hot", NOW)).toEqual([]);
  });
});

describe("parseSortMode", () => {
  it("accepts the four modes and falls back to hot", () => {
    expect(parseSortMode("new")).toBe("new");
    expect(parseSortMode("fan")).toBe("fan");
    expect(parseSortMode("top")).toBe("top");
    expect(parseSortMode("hot")).toBe("hot");
    expect(parseSortMode(null)).toBe("hot");
    expect(parseSortMode("upvotes")).toBe("hot");
  });
});

describe("risingIds", () => {
  it("flags a new game climbing past several older high-vote games", () => {
    const old = Array.from({ length: 5 }, (_, i) => sug({ id: `old${i}`, upvotes: 400 - i, hoursAgo: 24 * 40 }));
    const riser = sug({ id: "riser", upvotes: 30, hoursAgo: 6 });
    const rising = risingIds([...old, riser], NOW);
    expect(rising.has("riser")).toBe(true);
    expect(rising.has("old0")).toBe(false);
  });

  it("ignores non-pending suggestions", () => {
    const old = Array.from({ length: 5 }, (_, i) => sug({ upvotes: 400 - i, hoursAgo: 24 * 40 }));
    const played = sug({ id: "p", upvotes: 30, hoursAgo: 6, status: "played" });
    expect(risingIds([...old, played], NOW).has("p")).toBe(false);
  });
});

describe("tonightLineup", () => {
  it("is empty for no suggestions or only played/rejected ones", () => {
    expect(tonightLineup([], NOW)).toEqual([]);
    expect(tonightLineup([sug({ status: "played" }), sug({ status: "rejected" })], NOW)).toEqual([]);
  });

  it("returns fewer than 5 when fewer are pending, without duplicates", () => {
    const list = [sug({ upvotes: 3 }), sug({ upvotes: 2 }), sug({ status: "played", upvotes: 100 })];
    const lineup = tonightLineup(list, NOW);
    expect(lineup).toHaveLength(2);
    expect(new Set(pickIds(lineup)).size).toBe(2);
  });

  it("is top 3 hot + best fresh + best fan, tagged with their reason", () => {
    const hot = Array.from({ length: 4 }, (_, i) => sug({ id: `hot${i}`, upvotes: 900 - i * 100, hoursAgo: 24 * 4 }));
    const freshA = sug({ id: "freshA", upvotes: 2, hoursAgo: 10 });
    const freshB = sug({ id: "freshB", upvotes: 1, hoursAgo: 20 });
    const fan = sug({ id: "fan", upvotes: 5, hoursAgo: 24 * 6, source: "viewer-made" });
    const lineup = tonightLineup([fan, freshB, ...hot, freshA], NOW);
    expect(lineup.map((p) => [p.suggestion.id, p.reason])).toEqual([
      ["hot0", "hot"],
      ["hot1", "hot"],
      ["hot2", "hot"],
      ["freshA", "new"],
      ["fan", "fan"],
    ]);
    expect(lineup.map((p) => p.label)).toEqual(["Đang hot", "Đang hot", "Đang hot", "Mới đề xuất", "Bộ Tộc tự làm"]);
  });

  it("falls back to the newest pending suggestion when nothing is fresh", () => {
    const hot = Array.from({ length: 3 }, (_, i) => sug({ id: `hot${i}`, upvotes: 900 - i * 100, hoursAgo: 24 * 4 }));
    const newer = sug({ id: "newer", upvotes: 0, hoursAgo: 24 * 5 });
    const older = sug({ id: "older", upvotes: 50, hoursAgo: 24 * 30 });
    const lineup = tonightLineup([older, ...hot, newer], NOW);
    expect(lineup.find((p) => p.reason === "new")?.suggestion.id).toBe("newer");
  });

  it("gives the fan slot to the next fan game when one is already chosen", () => {
    const fanHot = sug({ id: "fanHot", upvotes: 5000, hoursAgo: 24 * 4, source: "viewer-made" });
    const hot = Array.from({ length: 3 }, (_, i) => sug({ id: `hot${i}`, upvotes: 900 - i * 100, hoursAgo: 24 * 4 }));
    const fan2 = sug({ id: "fan2", upvotes: 1, hoursAgo: 24 * 20, source: "viewer-made" });
    const lineup = tonightLineup([fan2, fanHot, ...hot], NOW);
    expect(lineup[0]).toMatchObject({ reason: "hot", suggestion: { id: "fanHot" } });
    expect(lineup.find((p) => p.reason === "fan")?.suggestion.id).toBe("fan2");
    expect(new Set(pickIds(lineup)).size).toBe(lineup.length);
  });

  it("backfills an empty fan slot with the next hot suggestion", () => {
    const list = Array.from({ length: 7 }, (_, i) => sug({ id: `h${i}`, upvotes: 700 - i * 50, hoursAgo: 24 * 4 }));
    const lineup = tonightLineup(list, NOW);
    expect(lineup).toHaveLength(LINEUP_SIZE);
    expect(lineup.some((p) => p.reason === "fan")).toBe(false);
    expect(lineup.filter((p) => p.reason === "hot")).toHaveLength(4);
  });

  it("never includes played or rejected games", () => {
    const list = [
      sug({ id: "played", upvotes: 9999, status: "played", hoursAgo: 1, source: "viewer-made" }),
      sug({ id: "rejected", upvotes: 9999, status: "rejected", hoursAgo: 1 }),
      ...Array.from({ length: 6 }, (_, i) => sug({ id: `p${i}`, upvotes: 10 + i })),
    ];
    const lineup = tonightLineup(list, NOW);
    expect(pickIds(lineup)).not.toContain("played");
    expect(pickIds(lineup)).not.toContain("rejected");
    expect(lineup).toHaveLength(LINEUP_SIZE);
  });

  it("is stable for equal scores", () => {
    const list = Array.from({ length: 6 }, (_, i) => sug({ id: `t${5 - i}`, upvotes: 4, hoursAgo: 24 * 8 }));
    expect(pickIds(tonightLineup(list, NOW))).toEqual(pickIds(tonightLineup([...list].reverse(), NOW)));
  });
});
