import { describe, expect, it } from "vitest";
import { mapGlossaryEntries, mapGlossaryEntry } from "./mapper";

const row = {
  id: "g1",
  author_id: "u1",
  term: "  Moi Xoang ",
  meaning: " Giải đấu trên sóng, tập luyện bằng Goat Flappy Bird. ",
  source_url: "https://www.youtube.com/watch?v=UTf6x4oCBKU",
  approved: true,
  created_at: "2026-11-10T00:00:00Z",
  profiles: { display_name: "tocdem_2222", verified: false },
};

describe("mapGlossaryEntry", () => {
  it("maps a row, trims text and labels the source", () => {
    expect(mapGlossaryEntry(row)).toEqual({
      id: "g1",
      term: "Moi Xoang",
      meaning: "Giải đấu trên sóng, tập luyện bằng Goat Flappy Bird.",
      sourceUrl: "https://www.youtube.com/watch?v=UTf6x4oCBKU",
      sourceLabel: "YouTube",
      author: "tocdem_2222",
      authorId: "u1",
      authorVerified: false,
      createdAt: "2026-11-10T00:00:00Z",
      approved: true,
    });
  });
  it("drops rows whose source fails the policy or whose text is empty", () => {
    expect(mapGlossaryEntry({ ...row, source_url: "https://example.com/x" })).toBeNull();
    expect(mapGlossaryEntry({ ...row, term: "  " })).toBeNull();
    expect(mapGlossaryEntries([row, { ...row, id: "g2", meaning: "" }]).map((e) => e.id)).toEqual(["g1"]);
  });
  it("falls back to “Fan” and only trusts verified === true", () => {
    expect(mapGlossaryEntry({ ...row, profiles: null })?.author).toBe("Fan");
    expect(mapGlossaryEntry({ ...row, profiles: { display_name: "x", verified: true } })?.authorVerified).toBe(true);
  });
});
