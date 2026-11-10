import { describe, expect, it } from "vitest";
import type { ClassifiedVideo } from "@/features/videos/types";
import { trendingTopics } from "./trends";

const now = new Date("2026-11-09T12:00:00Z");
const v = (id: string, title: string, daysAgo: number): ClassifiedVideo => ({
  videoId: id,
  title,
  publishedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
  viewCount: 1,
  durationMinutes: 1,
  wasLive: true,
  gameSlug: "x",
});

describe("trendingTopics", () => {
  const topics = trendingTopics(
    [
      v("1", "(Restream) Phong trào Tetris lan khắp Bộ Tộc và Ao Làng Delta Force", 14),
      v("2", "(Garena Delta Force #6) Bộ ba nghẹo thủ", 11),
      v("3", "(Phòng Trà An Liễng #4) Đêm nhạc", 14),
      v("4", "(Restream) thi đấu Tetris trong discord", 2),
      v("5", "(Restream) Delta Force cũ", 60),
      v("6", "(Restream) chơi DFS cả đêm", 3),
    ],
    now,
  );

  it("counts recent mentions; ties go to the most recently mentioned", () => {
    expect(topics.slice(0, 2).map((t) => [t.id, t.count])).toEqual([
      ["tetris", 2],
      ["delta-force", 2],
    ]);
  });

  it("keeps the newest matching video as the link", () => {
    expect(topics.find((t) => t.id === "tetris")!.latest.videoId).toBe("4");
  });

  it("ignores old titles and partial words", () => {
    expect(topics.find((t) => t.id === "delta-force")!.count).toBe(2); // not the 60-day-old one, not "DFS"
  });

  it("drops topics nobody mentioned", () => {
    expect(topics.find((t) => t.id === "pewpew")).toBeUndefined();
  });
});
