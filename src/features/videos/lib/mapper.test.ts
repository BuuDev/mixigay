import { describe, expect, it } from "vitest";
import { mapGame, mapVideo } from "./mapper";

describe("videos mappers", () => {
  it("derives a thumbnail and minutes for videos", () => {
    const v = mapVideo({
      video_id: "abcDEF12345",
      title: "t",
      published_at: "2026-01-01T00:00:00Z",
      duration_seconds: 3599,
      view_count: 10,
      thumbnail_url: null,
      was_live: false,
      playlist_ids: [],
      manual_game_slug: null,
      auto_game_slug: "pubg",
    });
    expect(v.thumbnailUrl).toBe("https://i.ytimg.com/vi/abcDEF12345/hqdefault.jpg");
    expect(v.durationMinutes).toBe(60);
    expect(v.autoGameSlug).toBe("pubg");
  });

  it("flattens keywords and assigns a placeholder cover", () => {
    const g = mapGame({ slug: "pubg", name: "PUBG", is_vlog: false, cover_url: null, sort_order: 0, game_keywords: [{ keyword: "pubg" }] });
    expect(g.keywords).toEqual(["pubg"]);
    expect(g.cover).toMatch(/^from-/);
  });
});
