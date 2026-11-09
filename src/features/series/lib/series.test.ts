import { describe, expect, it } from "vitest";
import type { ClassifiedVideo } from "@/features/videos/types";
import { groupSeries, parseSeriesTitle } from "./series";

describe("parseSeriesTitle", () => {
  it("reads series and episode", () => {
    expect(parseSeriesTitle("(Phòng Trà An Liễng #4) Đêm nhạc dát vàng lỗ tai")).toEqual({
      series: "Phòng Trà An Liễng",
      slug: "phong-tra-an-lieng",
      episode: 4,
      rest: "Đêm nhạc dát vàng lỗ tai",
    });
  });

  it("accepts a series without an episode number", () => {
    expect(parseSeriesTitle("(GTA V 2026) Tam tấu Mù, Mùi, Mùng")).toMatchObject({ slug: "gta-v-2026", episode: undefined });
  });

  it("ignores restreams and untagged titles", () => {
    expect(parseSeriesTitle("(Restream) Tâm sự cuối tuần")).toBeNull();
    expect(parseSeriesTitle("Vlog Đà Lạt")).toBeNull();
    expect(parseSeriesTitle("()")).toBeNull();
  });
});

const v = (videoId: string, title: string, publishedAt: string, viewCount = 1): ClassifiedVideo => ({
  videoId,
  title,
  publishedAt,
  viewCount,
  durationMinutes: 1,
  wasLive: false,
  gameSlug: "x",
});

describe("groupSeries", () => {
  const series = groupSeries([
    v("a", "(Ramen #1) mở tiệm", "2026-10-20T00:00:00Z", 10),
    v("b", "(Ramen #2) đông khách", "2026-10-27T00:00:00Z", 5),
    v("c", "(Delta Force #6) ao làng", "2026-11-01T00:00:00Z", 7),
    v("d", "(Restream) chill", "2026-11-08T00:00:00Z", 99),
  ]);

  it("groups by series, most recently active first", () => {
    expect(series.map((s) => s.slug)).toEqual(["delta-force", "ramen"]);
  });

  it("orders episodes newest first and sums views", () => {
    const ramen = series[1];
    expect(ramen.episodes.map((e) => e.episode)).toEqual([2, 1]);
    expect(ramen.totalViews).toBe(15);
    expect(ramen.episodes[0].episodeTitle).toBe("đông khách");
  });
});
