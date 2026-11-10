import { describe, expect, it } from "vitest";
import { CONTRIBUTE_TILES, tileStat, type ContributeCounts, type ContributeKind } from "./contribute";

const tile = (kind: ContributeKind) => CONTRIBUTE_TILES.find((t) => t.kind === kind)!;
const counts: ContributeCounts = { suggestions: 1234, songs: 0, quiz: null, fanArt: 3, quotes: 1 };

describe("CONTRIBUTE_TILES", () => {
  it("has six tiles, game suggestions first, each kind once, internal links only", () => {
    expect(CONTRIBUTE_TILES).toHaveLength(6);
    expect(CONTRIBUTE_TILES[0].kind).toBe("suggestions");
    expect(new Set(CONTRIBUTE_TILES.map((t) => t.kind)).size).toBe(6);
    for (const t of CONTRIBUTE_TILES) expect(t.href.startsWith("/")).toBe(true);
  });

  it("gives every counted kind a unit and the uncounted one a hint", () => {
    for (const t of CONTRIBUTE_TILES) {
      if (t.kind === "amnesty") expect(t.hint).toBeTruthy();
      else expect(t.unit).toBeTruthy();
    }
  });

  it("does not end CTAs with an arrow (docs/07)", () => {
    for (const t of CONTRIBUTE_TILES) expect(t.cta).not.toMatch(/→\s*$/);
  });
});

describe("tileStat", () => {
  it("formats real counts in Vietnamese style with the unit", () => {
    expect(tileStat(tile("suggestions"), counts, false)).toEqual({ type: "count", value: "1.234", label: "game Bộ Tộc đã đề xuất" });
  });

  it("labels mock counts as sample data", () => {
    const stat = tileStat(tile("fanArt"), counts, true);
    expect(stat).toEqual({ type: "count", value: "3", label: "tranh trong phòng tranh (dữ liệu mẫu)" });
  });

  it("invites the first contribution when the count is zero", () => {
    expect(tileStat(tile("songs"), counts, false)).toEqual({ type: "hint", text: "Chưa có ai gửi, bạn mở hàng nhé" });
    expect(tileStat(tile("songs"), counts, true).type).toBe("hint");
  });

  it("shows a neutral hint when the count could not be read", () => {
    expect(tileStat(tile("quiz"), counts, false).type).toBe("hint");
  });

  it("never shows a number for Ân xá", () => {
    expect(tileStat(tile("amnesty"), counts, false)).toEqual({ type: "hint", text: tile("amnesty").hint });
  });
});
