import { describe, expect, it } from "vitest";
import type { Video } from "@/features/videos/types";
import { channelStats, pickMoments } from "./moments";

const v = (videoId: string, viewCount: number, publishedAt: string, wasLive = false, thumbnailUrl?: string): Video => ({
  videoId,
  title: `T ${videoId}`,
  viewCount,
  publishedAt,
  wasLive,
  durationMinutes: 10,
  thumbnailUrl,
});

const videos = [
  v("a", 100, "2026-11-01", true),
  v("b", 900, "2026-10-01"),
  v("c", 500, "2026-11-08", true, "https://i.ytimg.com/vi/c/custom.jpg"),
  v("d", 20, "2026-11-09"),
  v("e", 500, "2026-09-01", true),
];

describe("pickMoments", () => {
  it("puts the most-viewed first and the newest of the rest second, without repeats", () => {
    const { popular, latest } = pickMoments(videos, 2);
    expect(popular.map((m) => m.videoId)).toEqual(["b", "c"]);
    expect(latest.map((m) => m.videoId)).toEqual(["d", "a"]);
  });

  it("breaks view ties on id so the order is stable", () => {
    expect(pickMoments(videos, 3).popular.map((m) => m.videoId)).toEqual(["b", "c", "e"]);
  });

  it("keeps only the tile fields and fills a missing thumbnail", () => {
    const { popular, latest } = pickMoments(videos, 2);
    expect(Object.keys(popular[0]).sort()).toEqual(["thumbnailUrl", "title", "videoId", "viewCount"]);
    expect(popular[1].thumbnailUrl).toBe("https://i.ytimg.com/vi/c/custom.jpg");
    expect(latest[0].thumbnailUrl).toBe("https://i.ytimg.com/vi/d/hqdefault.jpg");
  });

  it("does not mutate the input and handles short lists", () => {
    const copy = [...videos];
    const rows = pickMoments(copy, 12);
    expect(copy).toEqual(videos);
    expect(rows.popular).toHaveLength(5);
    expect(rows.latest).toHaveLength(0);
    expect(pickMoments([])).toEqual({ popular: [], latest: [] });
  });
});

describe("channelStats", () => {
  it("counts videos, past streams and summed views", () => {
    expect(channelStats(videos)).toEqual({ videos: 5, streams: 3, views: 2020 });
    expect(channelStats([])).toEqual({ videos: 0, streams: 0, views: 0 });
  });
});
