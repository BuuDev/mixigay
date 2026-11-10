import { describe, expect, it } from "vitest";
import { BGM_DEFAULT_VOLUME, isQuietPath, parseBgmPref, parseVolume, shouldAutoStart } from "./bgm";
import { BGM_TRACKS, nextIndex, playlistMinutes, trackSrc } from "./bgm-tracks";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("parseBgmPref", () => {
  it("accepts only on/off", () => {
    expect(parseBgmPref("on")).toBe("on");
    expect(parseBgmPref("off")).toBe("off");
    expect(parseBgmPref(null)).toBeNull();
    expect(parseBgmPref("true")).toBeNull();
    expect(parseBgmPref(undefined)).toBeNull();
  });
});

describe("isQuietPath", () => {
  it("silences admin and invite pages only", () => {
    expect(isQuietPath("/admin")).toBe(true);
    expect(isQuietPath("/admin/quiz")).toBe(true);
    expect(isQuietPath("/moi/abc")).toBe(true);
    expect(isQuietPath("/gui-anh-do")).toBe(true);
    expect(isQuietPath("/")).toBe(false);
    expect(isQuietPath("/administrator")).toBe(false);
    expect(isQuietPath("/moitruong")).toBe(false);
  });
});

describe("shouldAutoStart", () => {
  it("starts on first interaction by default", () => {
    expect(shouldAutoStart({ pref: null, pathname: "/", alreadyActive: false })).toBe(true);
    expect(shouldAutoStart({ pref: "on", pathname: "/lich", alreadyActive: false })).toBe(true);
  });
  it("never restarts music the visitor turned off", () => {
    expect(shouldAutoStart({ pref: "off", pathname: "/", alreadyActive: false })).toBe(false);
  });
  it("does nothing when already playing or on a quiet page", () => {
    expect(shouldAutoStart({ pref: null, pathname: "/", alreadyActive: true })).toBe(false);
    expect(shouldAutoStart({ pref: null, pathname: "/admin", alreadyActive: false })).toBe(false);
  });
});

describe("parseVolume", () => {
  it("keeps a stored volume in range, else the default", () => {
    expect(parseVolume("0.55")).toBe(0.55);
    expect(parseVolume("0")).toBe(0);
    expect(parseVolume("1.5")).toBe(BGM_DEFAULT_VOLUME);
    expect(parseVolume("abc")).toBe(BGM_DEFAULT_VOLUME);
    expect(parseVolume(null)).toBe(BGM_DEFAULT_VOLUME);
    expect(parseVolume("")).toBe(BGM_DEFAULT_VOLUME);
  });
});

describe("playlist", () => {
  it("is long enough to sit in the background (> 30 min) and loops", () => {
    expect(playlistMinutes()).toBeGreaterThan(30);
    expect(nextIndex(BGM_TRACKS.length - 1)).toBe(0);
    expect(nextIndex(0)).toBe(1);
    expect(nextIndex(3, 0)).toBe(0);
  });
  it.each(BGM_TRACKS)("ships the file for $title", (t) => {
    expect(existsSync(join(process.cwd(), "public", trackSrc(t)))).toBe(true);
  });
});
