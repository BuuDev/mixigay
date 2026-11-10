import { describe, expect, it } from "vitest";
import { isLiveView } from "./view";

describe("isLiveView", () => {
  it("is live only with a state of live and a video to link to", () => {
    expect(isLiveView({ state: "live", videoId: "abc" })).toBe(true);
    expect(isLiveView({ state: "live" })).toBe(false);
    expect(isLiveView({ state: "upcoming", videoId: "abc" })).toBe(false);
    expect(isLiveView({ state: "offline" })).toBe(false);
  });
});
