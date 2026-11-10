import { describe, expect, it } from "vitest";
import {
  announcement,
  canFloat,
  capNewest,
  combo,
  comboLabel,
  cooldownLeft,
  createBucket,
  emptyTally,
  floatPath,
  isReactionId,
  parseReactionPayload,
  pruneEvents,
  REACTIONS,
  SEND_LIMIT,
  shouldAnnounce,
  tally,
  takeToken,
  type ReactionEvent,
  type ReactionId,
} from "./reactions";

const ev = (seq: number, id: ReactionId, at: number, own = false): ReactionEvent => ({ seq, id, at, own });

describe("reaction set", () => {
  it("has exactly the four fixed reactions", () => {
    expect(REACTIONS.map((r) => r.id)).toEqual(["fire", "heart", "laugh", "salute"]);
    expect(REACTIONS.map((r) => r.label)).toEqual(["Cháy", "Thương", "Cười", "Chào Tộc Trưởng"]);
  });
});

describe("isReactionId / parseReactionPayload", () => {
  it.each(["fire", "heart", "laugh", "salute"])("accepts %s", (id) => {
    expect(isReactionId(id)).toBe(true);
    expect(parseReactionPayload({ id })).toBe(id);
  });
  it.each([undefined, null, 1, "", "FIRE", "🔥", "toString", "__proto__", "fire ", { id: "fire" }])("rejects %j", (x) => expect(isReactionId(x)).toBe(false));
  it.each([null, undefined, "fire", 42, [], { id: "hello anh em" }, { id: 1 }, { text: "fire" }, { id: ["fire"] }])("drops payload %j", (p) =>
    expect(parseReactionPayload(p)).toBeNull(),
  );
  it("ignores extra fields but keeps only the id", () => expect(parseReactionPayload({ id: "heart", text: "spam" })).toBe("heart"));
});

describe("takeToken", () => {
  it("allows a burst of 5, then cools down", () => {
    let s = createBucket(0);
    const results: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const r = takeToken(s, i * 10);
      results.push(r.ok);
      s = r.state;
    }
    expect(results).toEqual([true, true, true, true, true, false, false]);
    expect(cooldownLeft(s, 60)).toBeGreaterThan(0);
  });

  it("blocks during cooldown even if tokens came back, then allows again", () => {
    let s = createBucket(0);
    for (let i = 0; i < 5; i++) s = takeToken(s, 0).state;
    expect(s.coolUntil).toBe(SEND_LIMIT.cooldownMs);
    expect(takeToken(s, 1000).ok).toBe(false);
    const after = takeToken(s, SEND_LIMIT.cooldownMs);
    expect(after.ok).toBe(true);
    expect(cooldownLeft(after.state, SEND_LIMIT.cooldownMs)).toBe(0);
  });

  it("sustains one send per refill interval", () => {
    let s = createBucket(0);
    let sent = 0;
    for (let t = 0; t <= 10_000; t += SEND_LIMIT.refillMs) {
      const r = takeToken(s, t);
      if (r.ok) sent++;
      s = r.state;
    }
    // Steady state: never more than one token per interval after the burst.
    expect(sent).toBeLessThanOrEqual(Math.floor(10_000 / SEND_LIMIT.refillMs) + SEND_LIMIT.capacity + 1);
    expect(sent).toBeGreaterThan(20);
  });

  it("never exceeds capacity after a long idle", () => {
    const s = takeToken(createBucket(0), 0).state;
    const later = takeToken(s, 1_000_000).state;
    expect(later.tokens).toBe(SEND_LIMIT.capacity - 1);
  });

  it("survives a clock that goes backwards", () => {
    const s = createBucket(1000);
    const r = takeToken(s, 500);
    expect(r.ok).toBe(true);
    expect(Number.isFinite(r.state.tokens)).toBe(true);
  });
});

describe("render cap", () => {
  it("canFloat stops at the cap", () => {
    expect(canFloat(39)).toBe(true);
    expect(canFloat(40)).toBe(false);
    expect(canFloat(3, 3)).toBe(false);
  });
  it("capNewest keeps the newest items", () => {
    expect(capNewest([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
    expect(capNewest([1, 2], 3)).toEqual([1, 2]);
  });
});

describe("pruneEvents / tally / combo", () => {
  const events = [ev(1, "fire", 0), ev(2, "heart", 30_000), ev(3, "fire", 59_500), ev(4, "fire", 59_600), ev(5, "laugh", 59_900)];

  it("pruneEvents drops events outside the window and caps the length", () => {
    expect(pruneEvents(events, 60_000).map((e) => e.seq)).toEqual([2, 3, 4, 5]);
    expect(pruneEvents(events, 60_000, 60_000, 2).map((e) => e.seq)).toEqual([4, 5]);
  });

  it("tally counts per id inside the window", () => {
    expect(tally(events, 60_000, 60_000)).toEqual({ fire: 2, heart: 1, laugh: 1, salute: 0 });
    expect(tally(events, 60_000, 1_000)).toEqual({ fire: 2, heart: 0, laugh: 1, salute: 0 });
    expect(tally([], 0, 1000)).toEqual(emptyTally());
  });

  it("combo needs the threshold and picks the busiest id", () => {
    const burst = [
      ...Array.from({ length: 12 }, (_, i) => ev(i, "fire", 10_000 + i * 10)),
      ...Array.from({ length: 6 }, (_, i) => ev(100 + i, "heart", 10_000)),
    ];
    const c = combo(burst, 10_500);
    expect(c).toEqual({ id: "fire", count: 12 });
    expect(comboLabel(c!)).toBe("🔥 ×12");
    expect(combo(burst.slice(0, 4), 10_500)).toBeNull();
    expect(combo(burst, 20_000)).toBeNull();
  });
});

describe("floatPath", () => {
  it("stays inside bounds for extreme random values", () => {
    for (const v of [0, 0.5, 0.999999, 1, -1, 2]) {
      const p = floatPath(() => v);
      expect(p.x).toBeGreaterThanOrEqual(12);
      expect(p.x).toBeLessThanOrEqual(88);
      expect(Math.abs(p.rotate)).toBeLessThanOrEqual(24);
      expect(p.scale).toBeGreaterThanOrEqual(1);
      expect(p.scale).toBeLessThanOrEqual(1.5);
      expect(p.duration).toBeGreaterThanOrEqual(1.8);
      expect(p.duration).toBeLessThanOrEqual(2.7);
    }
  });
  it("curves: mid and end drift go opposite ways", () => {
    const seq = [0.2, 0.5, 0.5, 0.5, 0.5, 0.5];
    let i = 0;
    const p = floatPath(() => seq[i++ % seq.length]);
    expect(Math.sign(p.driftMid)).toBe(-Math.sign(p.driftEnd));
  });
});

describe("announcements", () => {
  it("throttles to every 10 s", () => {
    expect(shouldAnnounce(null, 0)).toBe(true);
    expect(shouldAnnounce(0, 9_999)).toBe(false);
    expect(shouldAnnounce(0, 10_000)).toBe(true);
  });
  it("summarises the room without emoji spam", () => {
    expect(announcement(12, { fire: 3, heart: 0, laugh: 1, salute: 0 })).toBe("12 người Bộ Tộc đang ở đây. Một phút qua: 3 Cháy, 1 Cười.");
    expect(announcement(null, emptyTally())).toBe("");
    expect(announcement(4, emptyTally())).toBe("4 người Bộ Tộc đang ở đây.");
  });
});
