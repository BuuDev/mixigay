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
    expect(v.chapters).toBeUndefined();
    expect(v.isShort).toBe(false);
  });

  it("keeps a valid chapter list and the Short flag", () => {
    const chapters = [
      { t: 0, title: "Mở đầu" },
      { t: 60, title: "Phần 1" },
      { t: 120, title: "Phần 2" },
    ];
    const v = mapVideo({
      video_id: "s",
      title: "t",
      published_at: "2026-01-01T00:00:00Z",
      duration_seconds: 45,
      view_count: 1,
      thumbnail_url: null,
      was_live: false,
      playlist_ids: [],
      manual_game_slug: null,
      auto_game_slug: null,
      chapters,
      is_short: true,
    });
    expect(v.chapters).toEqual(chapters);
    expect(v.isShort).toBe(true);
  });

  it("flattens keywords and assigns a placeholder cover", () => {
    const g = mapGame({ slug: "pubg", name: "PUBG", is_vlog: false, cover_url: null, sort_order: 0, game_keywords: [{ keyword: "pubg" }] });
    expect(g.keywords).toEqual(["pubg"]);
    expect(g.cover).toMatch(/^from-/);
  });
});
