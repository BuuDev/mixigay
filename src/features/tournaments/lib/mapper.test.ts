import { describe, expect, it } from "vitest";
import { mapTournament, type TournamentRow } from "./mapper";

const row: TournamentRow = {
  slug: "giai-thu",
  name: "Giải thử",
  kind: "tetris",
  starts_on: "2026-11-10",
  ends_on: null,
  status: "finished",
  description: "",
  video_id: "abcDEF12345",
  source_url: "https://example.com/post",
  tournament_results: [
    { rank: 2, name: "B", note: "" },
    { rank: 1, name: "A", note: "ghi chú" },
  ],
};

describe("mapTournament", () => {
  it("maps columns and sorts results by rank", () => {
    const m = mapTournament(row)!;
    expect(m.startsOn).toBe("2026-11-10");
    expect(m.description).toBeNull();
    expect(m.results).toEqual([
      { rank: 1, name: "A", note: "ghi chú" },
      { rank: 2, name: "B", note: null },
    ]);
  });
  it("rejects unknown kind or status", () => {
    expect(mapTournament({ ...row, kind: "x" })).toBeNull();
    expect(mapTournament({ ...row, status: "x" })).toBeNull();
  });
  it("drops non-https sources and tolerates missing results", () => {
    const m = mapTournament({ ...row, source_url: "http://x.y", tournament_results: null })!;
    expect(m.sourceUrl).toBeNull();
    expect(m.results).toEqual([]);
  });
});
