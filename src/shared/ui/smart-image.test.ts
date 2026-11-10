import { describe, expect, it } from "vitest";
import { youtubeThumb } from "./smart-image";

describe("youtubeThumb", () => {
  it("rewrites any YouTube thumbnail variant to the requested fixed size", () => {
    expect(youtubeThumb("https://i.ytimg.com/vi/abcDEF12345/maxresdefault.jpg", "hq")).toBe("https://i.ytimg.com/vi/abcDEF12345/hqdefault.jpg");
    expect(youtubeThumb("https://i.ytimg.com/vi/abcDEF12345/hqdefault.jpg", "mq")).toBe("https://i.ytimg.com/vi/abcDEF12345/mqdefault.jpg");
    expect(youtubeThumb("https://i.ytimg.com/vi_webp/abc-DEF_123/sddefault.webp", "hq")).toBe("https://i.ytimg.com/vi/abc-DEF_123/hqdefault.jpg");
  });

  it("leaves every other image to next/image", () => {
    expect(youtubeThumb("/brand/official/mixigaming-badge.webp", "hq")).toBeNull();
    expect(youtubeThumb("https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1/header.jpg", "hq")).toBeNull();
    expect(youtubeThumb("https://i.ytimg.com.evil.example/vi/abcDEF12345/hqdefault.jpg", "hq")).toBeNull();
    expect(youtubeThumb({ src: "/x.png", width: 1, height: 1 }, "hq")).toBeNull();
  });
});
