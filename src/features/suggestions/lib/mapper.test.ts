import { describe, expect, it } from "vitest";
import { mapSuggestion } from "./mapper";

const base = {
  id: "s",
  name: "n",
  source: "steam" as const,
  url: null,
  reason: "r",
  status: "pending" as const,
  linked_game_slug: null,
  upvotes: 1,
  hidden: false,
  created_at: "2026-01-01T00:00:00Z",
  profiles: { display_name: "Fan", avatar_url: null },
};

describe("mapSuggestion", () => {
  it("only attaches steam info when both id and well-formed data exist", () => {
    expect(mapSuggestion({ ...base, steam_app_id: 5, steam_data: null }).steam).toBeUndefined();
    expect(mapSuggestion({ ...base, steam_app_id: 5, steam_data: { price: "1₫", genres: [] } }).steam).toEqual({ appId: 5, price: "1₫", genres: [] });
    expect(mapSuggestion({ ...base, steam_app_id: null, steam_data: null }).author).toBe("Fan");
  });

  it("drops malformed jsonb instead of rendering it", () => {
    const junk = [{}, { price: {}, genres: [] }, { price: "1₫", genres: "x" }, { price: "1₫", genres: [1] }, "str"];
    for (const steam_data of junk) {
      expect(mapSuggestion({ ...base, steam_app_id: 5, steam_data: steam_data as never }).steam).toBeUndefined();
    }
    expect(
      mapSuggestion({ ...base, steam_app_id: 5, steam_data: { price: "1₫", genres: [], headerImage: "javascript:x" } }).steam?.headerImage,
    ).toBeUndefined();
  });
});
