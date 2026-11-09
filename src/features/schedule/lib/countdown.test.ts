import { describe, expect, it } from "vitest";
import { formatCountdown } from "./countdown";

describe("formatCountdown", () => {
  it.each([
    [0, "00:00:00"],
    [-5000, "00:00:00"],
    [59_999, "00:00:59"],
    [3_661_000, "01:01:01"],
    [86_400_000 + 1000, "1 ngày 00:00:01"],
  ])("%d ms → %s", (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });
});
