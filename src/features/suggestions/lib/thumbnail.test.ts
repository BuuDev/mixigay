import { describe, expect, it } from "vitest";
import { mapSuggestion, SUGGESTION_SELECT, thumbnailUrlFor } from "./mapper";

const PATH = "suggestions/0b6f3c1e-2d4a-4e8b-9c7d-1a2b3c4d5e6f.webp";
const row = {
  id: "s",
  name: "n",
  source: "viewer-made" as const,
  url: null,
  reason: "r",
  status: "pending" as const,
  linked_game_slug: null,
  steam_app_id: null,
  steam_data: null,
  upvotes: 1,
  hidden: false,
  created_at: "2026-01-01T00:00:00Z",
  profiles: null,
};

describe("suggestion thumbnails", () => {
  it("selects thumbnail_path publicly but never the admin-only review", () => {
    expect(SUGGESTION_SELECT).toContain("thumbnail_path");
    expect(SUGGESTION_SELECT).not.toContain("thumbnail_review");
  });

  it("builds the Storage URL from the project URL", () => {
    expect(thumbnailUrlFor(PATH, "https://ref.supabase.co")).toBe(`https://ref.supabase.co/storage/v1/object/public/game-art/${PATH}`);
    expect(thumbnailUrlFor(null, "https://ref.supabase.co")).toBeUndefined();
    expect(thumbnailUrlFor("https://evil.example/x.webp", "https://ref.supabase.co")).toBeUndefined();
    expect(thumbnailUrlFor(PATH, "")).toBeUndefined();
  });

  it("leaves thumbnailUrl empty for rows without art (and rows from before the column)", () => {
    expect(mapSuggestion(row).thumbnailUrl).toBeUndefined();
    expect(mapSuggestion({ ...row, thumbnail_path: null }).thumbnailUrl).toBeUndefined();
  });
});
