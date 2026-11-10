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
  it("maps a cover on a pinned host", () => {
    const thumb = "https://i1.sndcdn.com/artworks-x-t500x500.jpg";
    expect(mapFanSong({ ...row, url: "https://soundcloud.com/a/b", thumbnail_url: thumb })?.thumbnailUrl).toBe(thumb);
  });
  it("drops a missing or off-host cover but keeps the song", () => {
    expect(mapFanSong({ ...row, url: "https://soundcloud.com/a/b", thumbnail_url: null })?.thumbnailUrl).toBeUndefined();
    expect(mapFanSong({ ...row, url: "https://soundcloud.com/a/b", thumbnail_url: "https://evil.example/x.gif" })).toMatchObject({ thumbnailUrl: undefined });
  });
});
