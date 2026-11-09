import { describe, expect, it } from "vitest";
import { mapSample, mapStreamMeta } from "./mapper";

describe("stats mapper", () => {
  it("maps sample rows, tolerating bigint strings and nulls", () => {
    expect(mapSample({ video_id: "a", sampled_at: "2026-11-05T13:00:00+00:00", concurrent_viewers: 1200 })).toEqual({
      videoId: "a",
      sampledAt: "2026-11-05T13:00:00+00:00",
      viewers: 1200,
    });
    expect(mapSample({ video_id: "a", sampled_at: "x", concurrent_viewers: "34" }).viewers).toBe(34);
    expect(mapSample({ video_id: "a", sampled_at: "x", concurrent_viewers: null }).viewers).toBe(0);
    expect(mapSample({ video_id: "a", sampled_at: "x", concurrent_viewers: "oops" }).viewers).toBe(0);
  });

  it("maps video rows to stream metadata", () => {
    expect(mapStreamMeta({ video_id: "a", title: null, actual_start_at: "2026-11-05T13:00:00Z", actual_end_at: null })).toEqual({
      videoId: "a",
      title: "",
      actualStartAt: "2026-11-05T13:00:00Z",
      actualEndAt: undefined,
    });
  });
});
