import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LiveSample, ViewerPoint } from "../types";
import { downsample, sessionize } from "./sessions";

const at = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();
const run = (videoId: string, startIso: string, viewers: number[]): LiveSample[] =>
  viewers.map((v, i) => ({ videoId, sampledAt: at(startIso, i), viewers: v }));

function suite() {
  it("groups samples by video, newest stream first", () => {
    const samples = [...run("a", "2026-11-05T13:00:00Z", [10, 20, 30]), ...run("b", "2026-11-06T13:00:00Z", [5, 15])];
    const sessions = sessionize(samples);
    expect(sessions.map((s) => s.videoId)).toEqual(["b", "a"]);
    expect(sessions[1]).toMatchObject({
      startAt: "2026-11-05T13:00:00.000Z",
      endAt: "2026-11-05T13:02:00.000Z",
      durationMinutes: 2,
      peakViewers: 30,
      peakMinute: 2,
      avgViewers: 20,
      sampleCount: 3,
    });
  });

  it("sorts samples that arrive out of order and drops duplicate instants", () => {
    const samples = run("a", "2026-11-05T13:00:00Z", [10, 40, 20]).reverse();
    samples.push({ videoId: "a", sampledAt: "2026-11-05T13:01:00Z", viewers: 999 });
    const [s] = sessionize(samples);
    expect(s.points).toEqual([
      { minute: 0, viewers: 10 },
      { minute: 1, viewers: 40 },
      { minute: 2, viewers: 20 },
    ]);
    expect(s.peakViewers).toBe(40);
  });

  it("prefers YouTube's actual start and end when they bracket the samples", () => {
    const samples = run("a", "2026-11-05T13:03:00Z", [10, 20]);
    const [s] = sessionize(samples, [{ videoId: "a", title: "Buổi A", actualStartAt: "2026-11-05T13:00:00Z", actualEndAt: "2026-11-05T13:10:00Z" }]);
    expect(s.title).toBe("Buổi A");
    expect(s.startAt).toBe("2026-11-05T13:00:00.000Z");
    expect(s.durationMinutes).toBe(10);
    expect(s.points[0].minute).toBe(3);
  });

  it("ignores metadata that contradicts the samples", () => {
    const samples = run("a", "2026-11-05T13:00:00Z", [10, 20]);
    const [s] = sessionize(samples, [{ videoId: "a", title: "A", actualStartAt: "2026-11-05T13:05:00Z", actualEndAt: "2026-11-05T12:00:00Z" }]);
    expect(s.startAt).toBe("2026-11-05T13:00:00.000Z");
    expect(s.endAt).toBe("2026-11-05T13:01:00.000Z");
  });

  it("treats zero readings as gaps but keeps them for start and end", () => {
    const [s] = sessionize(run("a", "2026-11-05T13:00:00Z", [0, 100, 0, 300, 0]));
    expect(s.durationMinutes).toBe(4);
    expect(s.sampleCount).toBe(2);
    expect(s.avgViewers).toBe(200);
    expect(s.peakMinute).toBe(3);
  });

  it("handles a stream with only zero readings and skips invalid timestamps", () => {
    const [s] = sessionize([...run("a", "2026-11-05T13:00:00Z", [0, 0]), { videoId: "a", sampledAt: "nope", viewers: 50 }]);
    expect(s).toMatchObject({ peakViewers: 0, avgViewers: 0, sampleCount: 0, points: [] });
  });

  it("returns nothing for no samples", () => {
    expect(sessionize([])).toEqual([]);
  });
}

describe("sessionize", suite);

describe("sessionize under another server time zone", () => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "Pacific/Kiritimati";
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });
  suite();
});

describe("downsample", () => {
  const series: ViewerPoint[] = Array.from({ length: 1000 }, (_, i) => ({ minute: i, viewers: i === 517 ? 99_999 : 1000 + (i % 7) }));

  it("leaves short series alone", () => {
    expect(downsample(series.slice(0, 10), 50)).toHaveLength(10);
  });

  it("caps the length, keeps the ends and keeps the peak", () => {
    const out = downsample(series, 100);
    expect(out).toHaveLength(100);
    expect(out[0]).toEqual(series[0]);
    expect(out[out.length - 1]).toEqual(series[999]);
    expect(out.some((p) => p.viewers === 99_999 && p.minute === 517)).toBe(true);
    expect(out.every((p, i) => i === 0 || p.minute > out[i - 1].minute)).toBe(true);
  });
});
