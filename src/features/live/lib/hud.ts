// Numbers for the GTA-style HUD on the live hero (an original take on the
// "money counter + wanted stars" look; no game assets are used).

/** Hype level 0–5 from concurrent viewers. */
export function hypeStars(viewers: number): number {
  const steps = [1_000, 10_000, 30_000, 60_000, 100_000];
  return steps.filter((s) => viewers >= s).length;
}

/** "00048213" — fixed-width counter digits. */
export function hudDigits(n: number, width = 8): string {
  return String(Math.max(0, Math.round(n))).padStart(width, "0").slice(-Math.max(width, String(Math.round(n)).length));
}
