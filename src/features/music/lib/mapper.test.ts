import { describe, expect, it } from "vitest";
import { mapFanSong } from "./mapper";

const row = { id: "1", title: "Bài", artist: "Fan", note: null, approved: true, created_at: "2026-11-01T00:00:00Z" };

describe("mapFanSong", () => {
  it("maps a valid row with its platform", () => {
    expect(mapFanSong({ ...row, url: "https://soundcloud.com/a/b" })).toMatchObject({ platform: "soundcloud", note: undefined });
  });
  it("drops rows with a link that fails the platform check", () => {
    expect(mapFanSong({ ...row, url: "https://evil.example/x" })).toBeNull();
  });
});
