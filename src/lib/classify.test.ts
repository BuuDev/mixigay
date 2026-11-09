import { describe, expect, it } from "vitest";
import { classifyVideo, gradientFor, UNCLASSIFIED } from "./classify";
import { games } from "./mock-data";

const v = (title: string, extra: { manualGameSlug?: string; playlistIds?: string[] } = {}) => ({ title, ...extra });

describe("classifyVideo", () => {
  it("matches a game keyword case-insensitively", () => {
    expect(classifyVideo(v("PUBG – Top 1 với 18 kill"), games)).toBe("pubg");
  });

  it("lets a manual tag win over keywords", () => {
    expect(classifyVideo(v("PUBG highlight", { manualGameSlug: "vlog" }), games)).toBe("vlog");
  });

  it("uses a mapped playlist before keywords", () => {
    const map = new Map([["PL1", "cs2"]]);
    expect(classifyVideo(v("PUBG nhưng trong playlist CS2", { playlistIds: ["PLx", "PL1"] }), games, map)).toBe("cs2");
  });

  it("ignores playlists that are not mapped", () => {
    expect(classifyVideo(v("Mixi City RP #1", { playlistIds: ["PLunknown"] }), games, new Map())).toBe("gta-v");
  });

  it("checks vlog keywords last so a game title containing 'review' stays a game", () => {
    expect(classifyVideo(v("Review PUBG mùa mới"), games)).toBe("pubg");
    expect(classifyVideo(v("Review bàn phím cơ"), games)).toBe("vlog");
  });

  it("falls back to unclassified", () => {
    expect(classifyVideo(v("Stream tâm sự cuối tuần"), games)).toBe(UNCLASSIFIED);
  });
});

describe("gradientFor", () => {
  it("is stable for the same slug", () => {
    expect(gradientFor("pubg")).toBe(gradientFor("pubg"));
    expect(gradientFor("pubg")).toMatch(/^from-/);
  });
});
