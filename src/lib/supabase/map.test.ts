import { describe, expect, it } from "vitest";
import { mapLiveStatus, mapSlot, mapSuggestion, mapVideo } from "./map";

describe("row mappers", () => {
  it("trims Postgres seconds off schedule times", () => {
    expect(mapSlot({ id: "1", day_of_week: 1, time_vn: "20:00:00", title: "PUBG", game_slug: null, note: null })).toEqual({
      id: "1",
      dayOfWeek: 1,
      time: "20:00",
      title: "PUBG",
      gameSlug: undefined,
      note: undefined,
    });
  });

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

  it("maps an offline live_status row without a video", () => {
    const s = mapLiveStatus({ state: "offline", video_id: null, title: null, start_time: null, concurrent_viewers: null, checked_at: null });
    expect(s.state).toBe("offline");
    expect(s.thumbnailUrl).toBeUndefined();
  });

  it("only attaches steam info when both id and data exist", () => {
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
    expect(mapSuggestion({ ...base, steam_app_id: 5, steam_data: null }).steam).toBeUndefined();
    expect(mapSuggestion({ ...base, steam_app_id: 5, steam_data: { price: "1₫", genres: [] } }).steam).toEqual({ appId: 5, price: "1₫", genres: [] });
    expect(mapSuggestion({ ...base, steam_app_id: null, steam_data: null }).author).toBe("Fan");
    // Malformed jsonb must be dropped, not rendered.
    const junk = [{}, { price: {} , genres: [] }, { price: "1₫", genres: "x" }, { price: "1₫", genres: [1] }, "str"];
    for (const steam_data of junk) {
      expect(mapSuggestion({ ...base, steam_app_id: 5, steam_data: steam_data as never }).steam).toBeUndefined();
    }
    expect(mapSuggestion({ ...base, steam_app_id: 5, steam_data: { price: "1₫", genres: [], headerImage: "javascript:x" } }).steam?.headerImage).toBeUndefined();
  });
});
