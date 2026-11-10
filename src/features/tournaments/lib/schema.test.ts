import { describe, expect, it } from "vitest";
import { parseVideoId, resultInput, tournamentInput } from "./schema";

const base = {
  slug: "ao-lang-2026",
  name: "Ao Làng",
  kind: "ao-lang",
  status: "upcoming",
  starts_on: "",
  ends_on: "",
  description: "",
  video_id: "",
  source_url: "",
};

describe("parseVideoId", () => {
  it("accepts ids and common YouTube URLs", () => {
    expect(parseVideoId("abcDEF12345")).toBe("abcDEF12345");
    expect(parseVideoId("https://www.youtube.com/watch?v=abcDEF12345&t=10s")).toBe("abcDEF12345");
    expect(parseVideoId("https://youtu.be/abcDEF12345")).toBe("abcDEF12345");
    expect(parseVideoId("https://www.youtube.com/live/abcDEF12345?si=x")).toBe("abcDEF12345");
  });
  it("rejects anything else", () => {
    expect(parseVideoId("abc")).toBeNull();
    expect(parseVideoId("https://example.com/abcDEF12345")).toBeNull();
  });
});

describe("tournamentInput", () => {
  it("turns blank optional fields into null", () => {
    const t = tournamentInput.parse(base);
    expect(t).toMatchObject({ starts_on: null, ends_on: null, description: null, video_id: null, source_url: null });
  });
  it("enforces the slug rule", () => {
    expect(tournamentInput.safeParse({ ...base, slug: "ab" }).success).toBe(false);
    expect(tournamentInput.safeParse({ ...base, slug: "Ao_Lang" }).success).toBe(false);
  });
  it("rejects an end before the start and non-https sources", () => {
    expect(tournamentInput.safeParse({ ...base, starts_on: "2026-11-10", ends_on: "2026-11-09" }).success).toBe(false);
    expect(tournamentInput.safeParse({ ...base, source_url: "http://example.com" }).success).toBe(false);
    expect(tournamentInput.safeParse({ ...base, source_url: "https://example.com" }).success).toBe(true);
  });
  it("normalises a video URL to its id", () => {
    expect(tournamentInput.parse({ ...base, video_id: "https://youtu.be/abcDEF12345" }).video_id).toBe("abcDEF12345");
    expect(tournamentInput.safeParse({ ...base, video_id: "nope" }).success).toBe(false);
  });
});

describe("resultInput", () => {
  it("bounds rank to 1..64", () => {
    const r = { tournament_slug: "ao-lang-2026", rank: "1", name: "A", note: "" };
    expect(resultInput.parse(r)).toEqual({ tournament_slug: "ao-lang-2026", rank: 1, name: "A", note: null });
    expect(resultInput.safeParse({ ...r, rank: "65" }).success).toBe(false);
    expect(resultInput.safeParse({ ...r, rank: "0" }).success).toBe(false);
  });
});
