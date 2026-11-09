import { describe, expect, it } from "vitest";
import { songPlatform } from "./song-url";

describe("songPlatform", () => {
  it.each([
    ["https://soundcloud.com/snowrin/c-m-n-anh-mixi", "soundcloud"],
    ["https://www.youtube.com/watch?v=abc", "youtube"],
    ["https://m.youtube.com/watch?v=abc", "youtube"],
    ["https://youtu.be/abc", "youtube"],
    ["https://www.tiktok.com/@qnt.36/video/1", "tiktok"],
    ["https://open.spotify.com/track/1", "spotify"],
    ["https://zingmp3.vn/bai-hat/x.html", "zingmp3"],
  ])("%s → %s", (url, platform) => expect(songPlatform(url)).toBe(platform));

  it.each(["http://soundcloud.com/x", "https://soundcloud.com.evil.example/x", "https://evil.example/soundcloud.com/x", "https://soundcloud.com/", "javascript:alert(1)", "not a url"])(
    "rejects %s",
    (url) => expect(songPlatform(url)).toBeNull(),
  );
});
