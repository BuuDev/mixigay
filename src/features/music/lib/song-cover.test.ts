import { describe, expect, it } from "vitest";
import { coverHostAllowed, parseOembedCover, youtubeCover, youtubeVideoId } from "./song-cover";

describe("coverHostAllowed", () => {
  it.each([
    "https://i1.sndcdn.com/artworks-H5qUJ2nglrLSUdV5-2pWQxg-t500x500.jpg",
    "https://i9.sndcdn.com/a.jpg",
    "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "https://i.scdn.co/image/ab67616d0000b273",
    "https://image-cdn-ak.spotifycdn.com/image/abc",
    "https://image-cdn-fa.spotifycdn.com/image/abc",
  ])("accepts %s", (url) => expect(coverHostAllowed(url)).toBe(true));

  it.each([
    "http://i1.sndcdn.com/a.jpg",
    "https://i1.sndcdn.com.evil.com/a.jpg",
    "https://i10.sndcdn.com/a.jpg",
    "https://a1.sndcdn.com/a.jpg",
    "https://evil.com/https://i.ytimg.com/a.jpg",
    "https://i.ytimg.com/",
    "https://i.ytimg.com/a b.jpg",
    "https://i.ytimgXcom/a.jpg",
    "https://image-cdn-abc.spotifycdn.com/x",
    "https://image-cdn-AK.spotifycdn.com/x",
    "https://i.scdn.co@evil.com/x",
    "javascript:alert(1)",
    "",
  ])("rejects %s", (url) => expect(coverHostAllowed(url)).toBe(false));

  it("rejects URLs over 500 characters", () => {
    expect(coverHostAllowed(`https://i.scdn.co/${"a".repeat(500)}`)).toBe(false);
  });
});

describe("youtubeCover", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?list=x&v=dQw4w9WgXcQ&t=10", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/abc-DEF_123", "abc-DEF_123"],
  ])("builds the hqdefault cover for %s", (url, id) => {
    expect(youtubeCover(url)).toBe(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  });

  it.each([
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQx",
    "https://www.youtube.com/watch?v=dQw4w9WgX%2F",
    "https://www.youtube.com/channel/UC123",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "https://soundcloud.com/a/b",
    "not a url",
  ])("returns null for %s", (url) => {
    expect(youtubeCover(url)).toBeNull();
  });

  it("produces covers that pass the host pin", () => {
    expect(coverHostAllowed(youtubeCover("https://youtu.be/dQw4w9WgXcQ")!)).toBe(true);
    expect(youtubeVideoId("https://youtu.be/")).toBeNull();
  });
});

describe("parseOembedCover", () => {
  it("keeps a thumbnail on a pinned host", () => {
    const url = "https://i1.sndcdn.com/artworks-x-t500x500.jpg";
    expect(parseOembedCover({ type: "rich", thumbnail_url: url })).toBe(url);
  });
  it("drops a thumbnail on any other host", () => {
    expect(parseOembedCover({ thumbnail_url: "https://evil.example/pixel.gif" })).toBeNull();
  });
  it.each([null, undefined, "x", 42, [], {}, { thumbnail_url: 1 }])("returns null for %j", (json) => {
    expect(parseOembedCover(json)).toBeNull();
  });
});
