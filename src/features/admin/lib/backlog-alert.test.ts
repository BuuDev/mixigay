import { describe, expect, it } from "vitest";
import { backlogAlerts, hourBucket, REPORT_SPIKE, SUBMISSION_SPIKE } from "./backlog-alert";

const now = new Date("2026-11-10T14:37:00Z");
const url = "https://example.test/admin";

describe("hourBucket", () => {
  it("is the UTC hour", () => {
    expect(hourBucket(now)).toBe("2026-11-10T14");
  });
});

describe("backlogAlerts", () => {
  it("stays quiet under the thresholds", () => {
    expect(backlogAlerts({ pending: { "Đề xuất": SUBMISSION_SPIKE - 1 }, reports: REPORT_SPIKE - 1 }, now, url)).toEqual([]);
  });

  it("flags a submission spike summed across queues, biggest queue first", () => {
    const [a] = backlogAlerts({ pending: { Quote: 4, "Đề xuất": 12, "Lời nhắn": 0, "Nhạc nịnh": 4 }, reports: 0 }, now, url);
    expect(a.kind).toBe("submission_spike");
    expect(a.bucket).toBe("2026-11-10T14");
    expect(a.text).toContain("20 nội dung");
    expect(a.text).toContain("Đề xuất: 12, Quote: 4, Nhạc nịnh: 4");
    expect(a.text).not.toContain("Lời nhắn");
    expect(a.text).toContain(url);
  });

  it("flags a report spike separately", () => {
    const alerts = backlogAlerts({ pending: {}, reports: REPORT_SPIKE }, now, url);
    expect(alerts.map((a) => a.kind)).toEqual(["report_spike"]);
  });

  it("can raise both at once", () => {
    expect(backlogAlerts({ pending: { X: 30 }, reports: 15 }, now, url)).toHaveLength(2);
  });
});
