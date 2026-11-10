import { describe, expect, it } from "vitest";
import { mapLiveStatus } from "./mapper";

describe("mapLiveStatus", () => {
  it("maps an offline row without a video", () => {
    const s = mapLiveStatus({ state: "offline", video_id: null, title: null, start_time: null, concurrent_viewers: null, checked_at: null });
    expect(s.state).toBe("offline");
    expect(s.thumbnailUrl).toBeUndefined();
  });

  it("derives the thumbnail of a live video", () => {
    const s = mapLiveStatus({ state: "live", video_id: "abcDEF12345", title: "t", start_time: null, concurrent_viewers: 5, checked_at: null });
    expect(s.thumbnailUrl).toBe("https://i.ytimg.com/vi/abcDEF12345/hqdefault.jpg");
    expect(s.concurrentViewers).toBe(5);
  });
});
