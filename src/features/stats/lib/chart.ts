import type { ViewerPoint } from "../types";

/** "Nice" round axis ticks from 0 up to at least `max` (steps of 1, 2 or 5 × 10^k). */
export function niceTicks(max: number, target = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / Math.max(1, target);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = 0; ; v += step) {
    ticks.push(v);
    if (v >= max) break;
  }
  return ticks;
}

/** Elapsed-time ticks (minutes) for a stream of `duration` minutes: at most ~6 labels. */
export function timeTicks(duration: number): number[] {
  const span = Math.max(1, duration);
  const step = [15, 30, 60, 120, 180, 240].find((s) => span / s <= 6) ?? 360;
  const ticks: number[] = [];
  for (let m = 0; m <= span; m += step) ticks.push(m);
  return ticks;
}

/**
 * SVG path for the series in a `width` × `height` box (y grows downwards), x from
 * 0…xMax minutes, y from 0…yMax viewers. `area` closes the shape along the baseline.
 */
export function seriesPath(points: readonly ViewerPoint[], xMax: number, yMax: number, width: number, height: number, area = false): string {
  if (!points.length) return "";
  const x = (m: number) => round((Math.min(Math.max(m, 0), xMax) / Math.max(1, xMax)) * width);
  const y = (v: number) => round(height - (Math.min(Math.max(v, 0), yMax) / Math.max(1, yMax)) * height);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.minute)} ${y(p.viewers)}`).join(" ");
  if (!area) return line;
  return `${line} L${x(points[points.length - 1].minute)} ${height} L${x(points[0].minute)} ${height} Z`;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Index of the point whose minute is closest to `minute` (points sorted by minute); -1 when empty. */
export function nearestIndex(points: readonly ViewerPoint[], minute: number): number {
  if (!points.length) return -1;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].minute < minute) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(points[lo - 1].minute - minute) <= Math.abs(points[lo].minute - minute)) return lo - 1;
  return lo;
}

/**
 * Whole-hour [from, to] range (minutes of the stream day) that holds every value,
 * at least `minHours` wide; [20:00, 23:00] when there is nothing to show.
 */
export function clockDomain(minutes: readonly number[], minHours = 3): [number, number] {
  if (!minutes.length) return [20 * 60, 23 * 60];
  let from = Math.floor(Math.min(...minutes) / 60) * 60;
  let to = Math.ceil(Math.max(...minutes) / 60) * 60;
  while (to - from < minHours * 60) {
    to += 60;
    if (to - from < minHours * 60) from -= 60;
  }
  return [from, to];
}
