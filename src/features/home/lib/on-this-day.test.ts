import { describe, expect, it } from "vitest";
import type { Video } from "@/features/videos/types";
import { pickOnThisDay, yearsAgoLabel } from "./on-this-day";

const v = (videoId: string, publishedAt: string, viewCount = 100, thumbnailUrl?: string): Video => ({
  videoId,
  title: `T ${videoId}`,
  publishedAt,
  viewCount,
  wasLive: true,
  durationMinutes: 120,
  thumbnailUrl,
});
// 2026-11-10, evening in Vietnam.
const now = new Date("2026-11-10T13:00:00Z");

describe("pickOnThisDay", () => {
  it("picks the same Vietnam day-month in earlier years, newest year first, most-viewed first", () => {
    const pick = pickOnThisDay(
      [
        v("a", "2023-11-10T15:00:00Z", 10), // 22:00 VN on 10/11
        v("b", "2023-11-10T03:00:00Z", 900),
        v("c", "2025-11-10T10:00:00Z", 50),
        v("now", "2026-11-10T01:00:00Z", 9999), // this year: not "năm xưa"
        v("other", "2024-11-12T10:00:00Z", 9999),
      ],
      now,
    );
    expect(pick?.mode).toBe("exact");
    expect(pick?.years.map((y) => [y.year, y.yearsAgo, y.videos.map((x) => x.videoId)])).toEqual([
      [2025, 1, ["c"]],
      [2023, 3, ["b", "a"]],
    ]);
  });

  it("uses the Vietnam day: 17:30Z on the 9th is already the 10th in Vietnam", () => {
    const pick = pickOnThisDay([v("late", "2024-11-09T17:30:00Z"), v("early", "2024-11-10T17:30:00Z")], now);
    expect(pick?.years[0].videos.map((x) => x.videoId)).toEqual(["late"]);
  });

  it("falls back to ±3 days when the exact day has nothing, and says so", () => {
    const pick = pickOnThisDay([v("near", "2024-11-13T10:00:00Z"), v("far", "2024-11-14T10:00:00Z"), v("before", "2022-11-07T10:00:00Z")], now);
    expect(pick?.mode).toBe("nearby");
    expect(pick?.years.map((y) => [y.year, y.videos.map((x) => x.videoId)])).toEqual([
      [2024, ["near"]],
      [2022, ["before"]],
    ]);
  });

  it("ignores the fallback when an exact match exists", () => {
    const pick = pickOnThisDay([v("exact", "2024-11-10T10:00:00Z", 1), v("near", "2025-11-11T10:00:00Z", 9999)], now);
    expect(pick?.mode).toBe("exact");
    expect(pick?.years.flatMap((y) => y.videos.map((x) => x.videoId))).toEqual(["exact"]);
  });

  it("handles the new-year edge in the fallback", () => {
    const jan1 = new Date("2027-01-01T05:00:00Z");
    const pick = pickOnThisDay([v("eve", "2025-12-30T05:00:00Z")], jan1);
    expect(pick?.mode).toBe("nearby");
    expect(pick?.years[0]).toMatchObject({ year: 2026, yearsAgo: 1 });
  });

  it("caps the count and spreads it across years", () => {
    const many = Array.from({ length: 10 }, (_, i) => v(`x${i}`, "2025-11-10T10:00:00Z", 1000 - i));
    const pick = pickOnThisDay([...many, v("old", "2020-11-10T10:00:00Z", 1)], now);
    const ids = pick?.years.flatMap((y) => y.videos.map((x) => x.videoId)) ?? [];
    expect(ids).toHaveLength(8);
    expect(ids).toContain("old");
    expect(pick?.years[0].videos[0].videoId).toBe("x0");
  });

  it("fills in a missing thumbnail and keeps only the needed fields", () => {
    const pick = pickOnThisDay([v("abc", "2024-11-10T10:00:00Z")], now);
    expect(pick?.years[0].videos[0]).toEqual({
      videoId: "abc",
      title: "T abc",
      thumbnailUrl: expect.stringContaining("abc"),
      viewCount: 100,
      publishedAt: "2024-11-10T10:00:00Z",
      wasLive: true,
    });
  });

  it("is null when nothing is near and ignores bad dates", () => {
    expect(pickOnThisDay([v("x", "2024-06-01T10:00:00Z"), v("bad", "not a date")], now)).toBeNull();
    expect(pickOnThisDay([], now)).toBeNull();
  });
});

describe("yearsAgoLabel", () => {
  it("reads naturally", () => {
    expect(yearsAgoLabel(3, "exact")).toBe("3 năm trước hôm nay");
    expect(yearsAgoLabel(1, "exact")).toBe("Năm ngoái, đúng hôm nay");
    expect(yearsAgoLabel(2, "nearby")).toBe("Quanh ngày này 2 năm trước");
    expect(yearsAgoLabel(1, "nearby")).toBe("Quanh ngày này năm ngoái");
  });
});
