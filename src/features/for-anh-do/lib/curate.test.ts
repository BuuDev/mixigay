import { describe, expect, it } from "vitest";
import type { Suggestion } from "@/features/suggestions/types";
import { selectTopGamesForStream } from "./curate";

const NOW = Date.parse("2026-11-09T12:00:00Z");

const SAMPLE: Suggestion[] = [
  {
    id: "1",
    name: "Game A",
    source: "steam",
    url: "https://store.steampowered.com/app/100",
    reason: "Chơi cùng anh em Refund rất vui",
    author: "Unverified_User_Name",
    createdAt: "2026-11-08T10:00:00Z",
    upvotes: 42,
    status: "pending",
  },
  {
    id: "2",
    name: "Game B",
    source: "other",
    url: "https://evil-untrusted.example/download",
    reason: "Game giải đố kinh dị ngắn",
    author: "Another_User",
    createdAt: "2026-11-07T10:00:00Z",
    upvotes: 99,
    status: "pending",
  },
  {
    id: "3",
    name: "Game Đã Chơi",
    source: "steam",
    reason: "Đã chơi rồi",
    author: "User",
    createdAt: "2026-11-08T10:00:00Z",
    upvotes: 500,
    status: "played",
  },
];

describe("selectTopGamesForStream", () => {
  it("excludes played/rejected games, omits raw author names and untrusted URLs", () => {
    const res = selectTopGamesForStream(SAMPLE, NOW);
    expect(res.map((g) => g.id).sort()).toEqual(["1", "2"]);
    const byId = Object.fromEntries(res.map((g) => [g.id, g]));
    expect(byId["2"].safeUrl).toBeNull();
    expect(byId["1"].safeUrl).toBe("https://store.steampowered.com/app/100");
    for (const item of res) {
      expect(Object.keys(item)).not.toContain("author");
      expect(Object.keys(item)).not.toContain("authorId");
    }
  });

  it("follows tonight's lineup: a new fan game makes it in over older high-vote games, with its reason", () => {
    const old = Array.from({ length: 6 }, (_, i) => ({ ...SAMPLE[0], id: `old${i}`, upvotes: 400 - i, createdAt: "2026-10-01T10:00:00Z" }));
    const fan: Suggestion = { ...SAMPLE[0], id: "fan", source: "viewer-made", upvotes: 8, createdAt: "2026-11-09T10:00:00Z" };
    const res = selectTopGamesForStream([...old, fan], NOW);
    expect(res).toHaveLength(5);
    const pick = res.find((g) => g.id === "fan");
    expect(pick?.sourceLabel).toBe("Game Bộ Tộc tự làm");
    expect(["Đang hot", "Mới đề xuất", "Bộ Tộc tự làm"]).toContain(pick?.pickLabel);
  });

  it("honours the limit", () => {
    expect(selectTopGamesForStream(SAMPLE, NOW, 1)).toHaveLength(1);
  });
});
