import { describe, expect, it } from "vitest";
import { TAGS } from "@/shared/lib/cache-tags";
import { CONTENT_KINDS, isContentKind, KIND_IDS, KIND_LIST, linkHost, screenFields, toInboxItem } from "./kinds";

const base = { id: "11111111-1111-4111-8111-111111111111", author_id: "22222222-2222-4222-8222-222222222222", created_at: "2026-11-10T00:00:00Z" };

describe("CONTENT_KINDS", () => {
  it("covers every kind once, with its own table, tag and admin page", () => {
    expect(KIND_LIST.map((k) => k.kind)).toEqual([...KIND_IDS]);
    expect(new Set(KIND_LIST.map((k) => k.table)).size).toBe(KIND_IDS.length);
    for (const k of KIND_LIST) {
      expect(Object.values(TAGS)).toContain(k.cacheTag);
      expect(k.adminHref).toMatch(/^\/admin\/[a-z-]+$/);
      expect(k.select).toContain("id,author_id");
      expect(k.select).toContain("created_at");
    }
    expect(CONTENT_KINDS.suggestion.hiddenColumn).toBe(true);
  });

  it("isContentKind", () => {
    expect(isContentKind("quote")).toBe(true);
    expect(isContentKind("profile")).toBe(false);
    expect(isContentKind(1)).toBe(false);
  });
});

describe("toInboxItem", () => {
  it("rejects rows without id, author or date", () => {
    expect(toInboxItem("wall_message", { body: "x" })).toBeNull();
    expect(toInboxItem("wall_message", { ...base, author_id: null })).toBeNull();
  });

  it("suggestion: name, reason, link, Steam header when no stored art", () => {
    const item = toInboxItem("suggestion", {
      ...base,
      name: "Peak",
      reason: "Vui",
      url: "https://store.steampowered.com/app/1",
      source: "steam",
      steam_data: { headerImage: "https://shared.akamai.steamstatic.com/h.jpg" },
      thumbnail_path: null,
    });
    expect(item).toMatchObject({ kind: "suggestion", id: base.id, authorId: base.author_id, title: "Peak", body: "Vui", extra: "Steam" });
    expect(item?.imageUrl).toBe("https://shared.akamai.steamstatic.com/h.jpg");
  });

  it("suggestion: ignores a non-Steam header image and a javascript: link", () => {
    const item = toInboxItem("suggestion", {
      ...base,
      name: "X",
      reason: "",
      url: "javascript:alert(1)",
      steam_data: { headerImage: "https://evil.test/a.jpg" },
    });
    expect(item?.imageUrl).toBeUndefined();
    expect(item?.url).toBeUndefined();
    expect(item?.body).toBeUndefined();
  });

  it("fan song: cover, artist, note", () => {
    const item = toInboxItem("fan_song", {
      ...base,
      title: "Bài",
      artist: "Fan",
      url: "https://youtu.be/x",
      note: "hay",
      thumbnail_url: "https://i.scdn.co/a",
    });
    expect(item).toMatchObject({ title: "Bài", extra: "Fan", body: "hay", imageUrl: "https://i.scdn.co/a", url: "https://youtu.be/x" });
  });

  it("fan art: Drive thumbnail from the file id", () => {
    const item = toInboxItem("fan_art", {
      ...base,
      title: "Tranh",
      artist: "A",
      drive_url: "https://drive.google.com/file/d/abcdefghij12/view",
      drive_file_id: "abcdefghij12",
    });
    expect(item?.imageUrl).toBe("https://drive.google.com/thumbnail?id=abcdefghij12&sz=w400");
    expect(toInboxItem("fan_art", { ...base, title: "T", drive_file_id: "bad id" })?.imageUrl).toBeUndefined();
  });

  it("quote: quoted body and YouTube moment", () => {
    const item = toInboxItem("quote", { ...base, body: "Alo", video_id: "dQw4w9WgXcQ", at_seconds: 75 });
    expect(item?.title).toBe("“Alo”");
    expect(item?.url).toContain("dQw4w9WgXcQ");
    expect(item?.extra).toContain("1:15");
  });

  it("quiz, glossary, wall", () => {
    expect(toInboxItem("quiz_link", { ...base, title: "Q", url: "https://quizizz.com/x", description: "d" })).toMatchObject({ title: "Q", body: "d" });
    expect(toInboxItem("glossary_entry", { ...base, term: "Tộc", meaning: "m", source_url: "https://youtu.be/a" })).toMatchObject({
      title: "Tộc",
      body: "m",
      url: "https://youtu.be/a",
    });
    expect(toInboxItem("wall_message", { ...base, body: "Chào" })).toMatchObject({ title: "Chào" });
  });
});

describe("helpers", () => {
  it("screenFields keeps the non-empty texts", () => {
    const item = toInboxItem("fan_song", { ...base, title: "T", artist: "A", url: "https://x.y/z" });
    expect(item && screenFields(item)).toEqual(["T", "https://x.y/z", "A"]);
  });

  it("linkHost", () => {
    expect(linkHost("https://bit.ly/abc")).toBe("bit.ly");
    expect(linkHost("nope")).toBeUndefined();
    expect(linkHost(undefined)).toBeUndefined();
  });
});

describe("screenFields for quotes", () => {
  it("does not screen the site-built YouTube link (no false 'tên miền' flag)", () => {
    const item = { kind: "quote" as const, id: "q", createdAt: "", authorId: "a", title: "“Câu nói”", url: "https://www.youtube.com/watch?v=abcdefghijk&t=10s" };
    expect(screenFields(item)).toEqual(["“Câu nói”"]);
  });
});
