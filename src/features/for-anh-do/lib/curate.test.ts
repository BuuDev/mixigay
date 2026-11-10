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
  it("excludes played/rejected games, sorts by upvotes, and omits raw author names and untrusted URLs", () => {
    const res = selectTopGamesForStream(SAMPLE, NOW);
    expect(res.map((g) => g.id)).toEqual(["2", "1"]);
    expect(res[0].safeUrl).toBeNull();
    expect(res[1].safeUrl).toBe("https://store.steampowered.com/app/100");
    for (const item of res) {
      expect(Object.keys(item)).not.toContain("author");
      expect(Object.keys(item)).not.toContain("authorId");
    }
  });
});

