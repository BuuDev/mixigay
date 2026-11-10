import { describe, expect, it } from "vitest";
import { UNCLASSIFIED } from "./classify";
import { MAX_LIMIT, PAGE, parseVideoQuery, selectVideos, videoHref, videoTabs } from "./video-query";
import type { ClassifiedVideo, Game } from "../types";

const slugs = ["gta-v", "pubg"];
const v = (id: string, gameSlug: string, viewCount: number, publishedAt: string) =>
  ({ videoId: id, title: id, gameSlug, viewCount, publishedAt, durationMinutes: 60, wasLive: true }) as unknown as ClassifiedVideo;
const games = [
  { slug: "gta-v", name: "GTA V" },
  { slug: "pubg", name: "PUBG" },
  { slug: "the-isle", name: "The Isle" },
] as Game[];
const videos = [v("a", "gta-v", 10, "2026-11-01"), v("b", "gta-v", 50, "2026-10-01"), v("c", "pubg", 30, "2026-11-05"), v("d", UNCLASSIFIED, 5, "2026-11-08")];

describe("parseVideoQuery", () => {
  it("defaults", () => {
    expect(parseVideoQuery({}, slugs)).toEqual({ game: "all", sort: "views", limit: PAGE });
  });
  it("accepts known games, unclassified and newest", () => {
    expect(parseVideoQuery({ game: "pubg", sort: "newest" }, slugs)).toMatchObject({ game: "pubg", sort: "newest" });
    expect(parseVideoQuery({ game: UNCLASSIFIED }, slugs).game).toBe(UNCLASSIFIED);
  });
  it("falls back on unknown or hostile values", () => {
    expect(parseVideoQuery({ game: "<script>", sort: "x", n: "-5" }, slugs)).toEqual({ game: "all", sort: "views", limit: PAGE });
    expect(parseVideoQuery({ game: ["pubg", "gta-v"] }, slugs).game).toBe("pubg");
  });
  it("rounds the size up to whole pages and caps it", () => {
    expect(parseVideoQuery({ n: "50" }, slugs).limit).toBe(PAGE * 2);
    expect(parseVideoQuery({ n: "99999" }, slugs).limit).toBe(MAX_LIMIT);
    expect(parseVideoQuery({ n: "1.5" }, slugs).limit).toBe(PAGE);
  });
});

describe("videoHref", () => {
  it("omits defaults and round-trips", () => {
    expect(videoHref({ game: "all", sort: "views", limit: PAGE })).toBe("/video");
    const q = { game: "gta-v", sort: "newest" as const, limit: PAGE * 2 };
    const href = videoHref(q);
    expect(href).toBe(`/video?game=gta-v&sort=newest&n=${PAGE * 2}`);
    expect(parseVideoQuery(Object.fromEntries(new URL(href, "http://x").searchParams), slugs)).toEqual(q);
  });
});

describe("videoTabs", () => {
  it("counts per game, hides empty games, keeps all and unclassified", () => {
    expect(videoTabs(videos, games)).toEqual([
      { slug: "all", label: "Tất cả", count: 4 },
      { slug: "gta-v", label: "GTA V", count: 2 },
      { slug: "pubg", label: "PUBG", count: 1 },
      { slug: UNCLASSIFIED, label: "Chưa phân loại", count: 1 },
    ]);
  });
});

describe("selectVideos", () => {
  it("filters, sorts by views or date, and cuts to the page", () => {
    expect(selectVideos(videos, { game: "gta-v", sort: "views", limit: 48 }).items.map((x) => x.videoId)).toEqual(["b", "a"]);
    expect(selectVideos(videos, { game: "all", sort: "newest", limit: 2 })).toMatchObject({ total: 4, items: [{ videoId: "d" }, { videoId: "c" }] });
  });
});
