import { describe, expect, it } from "vitest";
import { mapQuote, mapQuotes, QUOTE_SELECT, type QuoteRow } from "./mapper";

const row: QuoteRow = {
  id: "q1",
  author_id: "u1",
  video_id: "dQw4w9WgXcQ",
  at_seconds: 125,
  body: "  một câu nói đáng nhớ  ",
  approved: true,
  created_at: "2026-11-10T14:00:00Z",
  profiles: { display_name: "tocdem", verified: true },
  videos: { title: "Tiêu đề video" },
};

describe("mapQuote", () => {
  it("maps a full row", () => {
    expect(mapQuote(row)).toEqual({
      id: "q1",
      body: "một câu nói đáng nhớ",
      videoId: "dQw4w9WgXcQ",
      videoTitle: "Tiêu đề video",
      atSeconds: 125,
      author: "tocdem",
      authorId: "u1",
      authorVerified: true,
      createdAt: "2026-11-10T14:00:00Z",
      approved: true,
    });
  });
  it("falls back for missing embeds", () => {
    const q = mapQuote({ ...row, profiles: null, videos: null });
    expect(q).toMatchObject({ author: "Fan", authorVerified: false, videoTitle: null });
    expect(mapQuote({ ...row, profiles: { display_name: "  " }, videos: { title: " " } })).toMatchObject({ author: "Fan", videoTitle: null });
  });
  it("drops rows that cannot be shown", () => {
    expect(mapQuote({ ...row, body: "   " })).toBeNull();
    expect(mapQuote({ ...row, body: null as unknown as string })).toBeNull();
    expect(mapQuote({ ...row, at_seconds: -1 })).toBeNull();
    expect(mapQuote({ ...row, at_seconds: 1.5 })).toBeNull();
    expect(mapQuote({ ...row, video_id: "" })).toBeNull();
  });
  it("mapQuotes filters bad rows", () => {
    expect(mapQuotes([row, { ...row, id: "q2", body: "" }]).map((q) => q.id)).toEqual(["q1"]);
  });
  it("names the FK of every embed", () => {
    expect(QUOTE_SELECT).toContain("profiles!author_id(");
    expect(QUOTE_SELECT).toContain("videos!video_id(");
  });
});
