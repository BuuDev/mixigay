import { describe, expect, it } from "vitest";
import { clockDomain, nearestIndex, niceTicks, seriesPath, timeTicks } from "./chart";

describe("niceTicks", () => {
  it("uses round steps that reach the maximum", () => {
    expect(niceTicks(48_213)).toEqual([0, 20_000, 40_000, 60_000]);
    expect(niceTicks(100)).toEqual([0, 50, 100]);
    expect(niceTicks(7, 4)).toEqual([0, 2, 4, 6, 8]);
  });

  it("falls back for empty data", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(NaN)).toEqual([0, 1]);
  });
});

describe("timeTicks", () => {
  it("picks at most about six labels", () => {
    expect(timeTicks(60)).toEqual([0, 15, 30, 45, 60]);
    expect(timeTicks(300)).toEqual([0, 60, 120, 180, 240, 300]);
    expect(timeTicks(500)).toEqual([0, 120, 240, 360, 480]);
    expect(timeTicks(0)).toEqual([0]);
  });
});

describe("seriesPath", () => {
  const pts = [
    { minute: 0, viewers: 0 },
    { minute: 50, viewers: 50 },
    { minute: 100, viewers: 100 },
  ];

  it("maps minutes to x and viewers to an inverted y", () => {
    expect(seriesPath(pts, 100, 100, 200, 100)).toBe("M0 100 L100 50 L200 0");
  });

  it("closes an area along the baseline", () => {
    expect(seriesPath(pts, 100, 100, 200, 100, true)).toBe("M0 100 L100 50 L200 0 L200 100 L0 100 Z");
  });

  it("clamps out-of-range values and handles empty input", () => {
    expect(seriesPath([{ minute: 150, viewers: 500 }], 100, 100, 200, 100)).toBe("M200 0");
    expect(seriesPath([], 100, 100, 200, 100)).toBe("");
  });
});

describe("nearestIndex", () => {
  const pts = [0, 10, 20, 40].map((minute) => ({ minute, viewers: 1 }));

  it("finds the closest point", () => {
    expect(nearestIndex(pts, -5)).toBe(0);
    expect(nearestIndex(pts, 14)).toBe(1);
    expect(nearestIndex(pts, 16)).toBe(2);
    expect(nearestIndex(pts, 31)).toBe(3);
    expect(nearestIndex(pts, 99)).toBe(3);
    expect(nearestIndex([], 5)).toBe(-1);
  });
});

describe("clockDomain", () => {
  it("rounds out to whole hours and keeps a minimum width", () => {
    expect(clockDomain([20 * 60 + 15, 21 * 60 + 5])).toEqual([20 * 60, 23 * 60]);
    expect(clockDomain([19 * 60 + 50, 24 * 60 + 10])).toEqual([19 * 60, 25 * 60]);
    expect(clockDomain([20 * 60])).toEqual([19 * 60, 22 * 60]);
    expect(clockDomain([])).toEqual([20 * 60, 23 * 60]);
  });
});
