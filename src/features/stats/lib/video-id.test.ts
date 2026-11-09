import { describe, expect, it } from "vitest";
import { isYoutubeVideoId } from "./video-id";

describe("isYoutubeVideoId", () => {
  it("accepts real ids", () => expect(isYoutubeVideoId("dQw4w9WgXcQ")).toBe(true));
  it("rejects demo and malformed ids", () => {
    for (const id of ["demoStream01", "short", "", "bad id here", "dQw4w9WgXc/"]) expect(isYoutubeVideoId(id)).toBe(false);
  });
});
