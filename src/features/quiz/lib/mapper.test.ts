import { describe, expect, it } from "vitest";
import type { QuizLink } from "../types";
import { groupQuizLinks, mapQuizLink, mapQuizLinks, QUIZ_LINK_SELECT, type QuizLinkRow } from "./mapper";

const row: QuizLinkRow = {
  id: "l1",
  author_id: "u1",
  title: "  Bạn có phải fan cứng của anh Độ?  ",
  url: "https://kahoot.it/challenge/01234567",
  description: "  20 câu về các series  ",
  played_video_id: null,
  played_at_seconds: null,
  approved: true,
  created_at: "2026-11-10T14:00:00Z",
  profiles: { display_name: "tocdem" },
};

describe("mapQuizLink", () => {
  it("maps a full row", () => {
    expect(mapQuizLink(row)).toEqual({
      id: "l1",
      title: "Bạn có phải fan cứng của anh Độ?",
      url: "https://kahoot.it/challenge/01234567",
      platform: "kahoot",
      description: "20 câu về các series",
      author: "tocdem",
      authorId: "u1",
      playedVideoId: undefined,
      playedAtSeconds: undefined,
      approved: true,
      createdAt: "2026-11-10T14:00:00Z",
    });
  });

  it("falls back for missing embeds and empty description", () => {
    expect(mapQuizLink({ ...row, profiles: null, description: null })).toMatchObject({ author: "Fan", description: undefined });
    expect(mapQuizLink({ ...row, profiles: { display_name: "  " }, description: "   " })).toMatchObject({ author: "Fan", description: undefined });
  });

  it("maps the played moment", () => {
    expect(mapQuizLink({ ...row, played_video_id: "dQw4w9WgXcQ", played_at_seconds: 3723 })).toMatchObject({
      playedVideoId: "dQw4w9WgXcQ",
      playedAtSeconds: 3723,
    });
    expect(mapQuizLink({ ...row, played_video_id: "dQw4w9WgXcQ", played_at_seconds: 0 })).toMatchObject({ playedAtSeconds: 0 });
    expect(mapQuizLink({ ...row, played_video_id: "dQw4w9WgXcQ", played_at_seconds: null })).toMatchObject({
      playedVideoId: "dQw4w9WgXcQ",
      playedAtSeconds: undefined,
    });
  });

  it("ignores a malformed played moment", () => {
    expect(mapQuizLink({ ...row, played_video_id: "not a video", played_at_seconds: 10 })).toMatchObject({
      playedVideoId: undefined,
      playedAtSeconds: undefined,
    });
    expect(mapQuizLink({ ...row, played_video_id: "dQw4w9WgXcQ", played_at_seconds: -5 })?.playedAtSeconds).toBeUndefined();
    expect(mapQuizLink({ ...row, played_video_id: "dQw4w9WgXcQ", played_at_seconds: 1.5 })?.playedAtSeconds).toBeUndefined();
  });

  it("drops rows that cannot be shown", () => {
    expect(mapQuizLink({ ...row, title: "   " })).toBeNull();
    expect(mapQuizLink({ ...row, title: null as unknown as string })).toBeNull();
    expect(mapQuizLink({ ...row, url: "https://kahoot.it.evil.com/x" })).toBeNull();
    expect(mapQuizLink({ ...row, url: "http://kahoot.it/x" })).toBeNull();
  });

  it("mapQuizLinks filters bad rows", () => {
    expect(mapQuizLinks([row, { ...row, id: "l2", url: "https://example.com/x" }]).map((l) => l.id)).toEqual(["l1"]);
  });

  it("names the FK of the profile embed", () => {
    expect(QUIZ_LINK_SELECT).toContain("profiles!author_id(");
  });
});

describe("groupQuizLinks", () => {
  const link = (id: string, createdAt: string, playedVideoId?: string): QuizLink => ({
    id,
    title: id,
    url: "https://forms.gle/x",
    platform: "google-forms",
    author: "Fan",
    approved: true,
    createdAt,
    playedVideoId,
  });

  it("splits played from fresh, newest first", () => {
    const { played, fresh } = groupQuizLinks([
      link("a", "2026-11-01T00:00:00Z"),
      link("b", "2026-11-03T00:00:00Z", "dQw4w9WgXcQ"),
      link("c", "2026-11-02T00:00:00Z"),
      link("d", "2026-11-04T00:00:00Z", "dQw4w9WgXcQ"),
    ]);
    expect(played.map((l) => l.id)).toEqual(["d", "b"]);
    expect(fresh.map((l) => l.id)).toEqual(["c", "a"]);
  });
});
