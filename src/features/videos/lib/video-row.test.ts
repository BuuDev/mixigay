import { describe, expect, it } from "vitest";
import { toVideoColumns } from "./video-row";

const now = new Date("2026-11-09T12:00:00Z");

describe("toVideoColumns", () => {
  it("maps a finished stream as completed and was_live", () => {
    const row = toVideoColumns(
      {
        id: "abcDEF12345",
        snippet: { title: "PUBG", publishedAt: "2026-11-08T13:00:00Z", liveBroadcastContent: "none" },
        contentDetails: { duration: "PT3H" },
        statistics: { viewCount: "1234" },
        liveStreamingDetails: { actualStartTime: "2026-11-08T13:00:00Z", actualEndTime: "2026-11-08T16:00:00Z" },
      },
      now,
    );
    expect(row).toMatchObject({ live_state: "completed", was_live: true, duration_seconds: 10800, view_count: 1234 });
    expect(row.thumbnail_url).toBe("https://i.ytimg.com/vi/abcDEF12345/hqdefault.jpg");
  });

  it("maps a scheduled stream as upcoming, not yet was_live", () => {
    const row = toVideoColumns(
      {
        id: "x",
        snippet: { title: "Sắp live", publishedAt: now.toISOString(), liveBroadcastContent: "upcoming" },
        liveStreamingDetails: { scheduledStartTime: "2026-11-09T13:00:00Z" },
      },
      now,
    );
    expect(row).toMatchObject({ live_state: "upcoming", was_live: false, scheduled_start_at: "2026-11-09T13:00:00Z", view_count: 0 });
  });

  it("maps a regular upload as none", () => {
    const row = toVideoColumns({ id: "v", snippet: { title: "Vlog", publishedAt: now.toISOString(), liveBroadcastContent: "none" } }, now);
    expect(row.live_state).toBe("none");
    expect(row.was_live).toBe(false);
    expect(row.chapters).toBeNull();
  });

  it("stores chapters from the description it already has", () => {
    const description = "Cảm ơn Bộ Tộc!\n0:00 Mở đầu\n5:00 Phần 1\n1:00:00 Phần 2";
    const row = toVideoColumns({ id: "v", snippet: { title: "Stream", description, publishedAt: now.toISOString(), liveBroadcastContent: "none" } }, now);
    expect(row.chapters).toEqual([
      { t: 0, title: "Mở đầu" },
      { t: 300, title: "Phần 1" },
      { t: 3600, title: "Phần 2" },
    ]);
  });
});
