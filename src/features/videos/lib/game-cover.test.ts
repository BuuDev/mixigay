import { describe, expect, it } from "vitest";
import { UNCLASSIFIED } from "./classify";
import { gameCoverRecord, gameCovers } from "./game-cover";
import type { ClassifiedVideo, Game } from "../types";

function video(over: Partial<ClassifiedVideo> & Pick<ClassifiedVideo, "videoId">): ClassifiedVideo {
  return {
    title: over.videoId,
    publishedAt: "2026-01-01T12:00:00Z",
    viewCount: 0,
    durationMinutes: 60,
    wasLive: false,
    thumbnailUrl: `https://i.ytimg.com/vi/${over.videoId}/hqdefault.jpg`,
    gameSlug: "gta-v",
    ...over,
  };
}

const game = (slug: string): Game => ({ slug, name: slug, keywords: [], cover: "" });

describe("gameCovers", () => {
  it("returns an empty map for no videos", () => {
    expect(gameCovers([]).size).toBe(0);
  });

  it("picks the newest video of each game", () => {
    const covers = gameCovers([
      video({ videoId: "old", publishedAt: "2026-01-01T00:00:00Z" }),
      video({ videoId: "new", publishedAt: "2026-03-01T00:00:00Z" }),
      video({ videoId: "other", gameSlug: "minecraft" }),
    ]);
    expect(covers.get("gta-v")?.videoId).toBe("new");
    expect(covers.get("minecraft")?.videoId).toBe("other");
  });

  it("prefers an older stream over a newer upload", () => {
    const covers = gameCovers([
      video({ videoId: "upload", publishedAt: "2026-05-01T00:00:00Z" }),
      video({ videoId: "stream", publishedAt: "2026-01-01T00:00:00Z", wasLive: true }),
    ]);
    expect(covers.get("gta-v")).toEqual({
      videoId: "stream",
      title: "stream",
      publishedAt: "2026-01-01T00:00:00Z",
      thumbnailUrl: "https://i.ytimg.com/vi/stream/hqdefault.jpg",
      wasLive: true,
    });
  });

  it("falls back to the newest upload when the game was never streamed", () => {
    const covers = gameCovers([video({ videoId: "a", publishedAt: "2026-01-01T00:00:00Z" }), video({ videoId: "b", publishedAt: "2026-02-01T00:00:00Z" })]);
    expect(covers.get("gta-v")?.videoId).toBe("b");
  });

  it("breaks publishedAt ties by videoId, independent of input order", () => {
    const a = video({ videoId: "aaa", wasLive: true });
    const b = video({ videoId: "bbb", wasLive: true });
    expect(gameCovers([a, b]).get("gta-v")?.videoId).toBe("aaa");
    expect(gameCovers([b, a]).get("gta-v")?.videoId).toBe("aaa");
  });

  it("skips Shorts, videos without a thumbnail and unclassified videos", () => {
    const covers = gameCovers([
      video({ videoId: "short", isShort: true, publishedAt: "2026-09-01T00:00:00Z" }),
      video({ videoId: "nothumb", thumbnailUrl: undefined, publishedAt: "2026-08-01T00:00:00Z" }),
      video({ videoId: "unc", gameSlug: UNCLASSIFIED }),
      video({ videoId: "ok" }),
    ]);
    expect(covers.get("gta-v")?.videoId).toBe("ok");
    expect(covers.has(UNCLASSIFIED)).toBe(false);
  });

  it("returns nothing for a game whose only videos are skipped", () => {
    expect(gameCovers([video({ videoId: "s", isShort: true })]).size).toBe(0);
  });

  it("limits covers to the given games", () => {
    const covers = gameCovers([video({ videoId: "g" }), video({ videoId: "m", gameSlug: "minecraft" })], [game("minecraft")]);
    expect([...covers.keys()]).toEqual(["minecraft"]);
  });

  it("gameCoverRecord returns a plain object", () => {
    expect(gameCoverRecord([video({ videoId: "g" })])["gta-v"]?.videoId).toBe("g");
  });
});
