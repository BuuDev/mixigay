import { describe, expect, it } from "vitest";
import { songPlatform, soundcloudEmbedUrl } from "./song-url";

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

describe("soundcloudEmbedUrl", () => {
  it("builds official w.soundcloud.com player URL for a valid track link", () => {
    const embed = soundcloudEmbedUrl("https://soundcloud.com/brother-br-h/cam-on-anh-do-mixi-shibidi", true);
    expect(embed).toContain("https://w.soundcloud.com/player/?");
    expect(embed).toContain("auto_play=true");
    expect(embed).toContain(encodeURIComponent("https://soundcloud.com/brother-br-h/cam-on-anh-do-mixi-shibidi"));
  });

  it("returns null for non-soundcloud or profile-only URLs", () => {
    expect(soundcloudEmbedUrl("https://www.youtube.com/watch?v=abc")).toBeNull();
    expect(soundcloudEmbedUrl("https://soundcloud.com/only-user")).toBeNull();
    expect(soundcloudEmbedUrl("https://on.soundcloud.com/short")).toBeNull();
  });
});
