import { describe, expect, it } from "vitest";
import { hudDigits, hypeStars } from "./hud";

describe("hypeStars", () => {
  it.each([
    [0, 0],
    [999, 0],
    [1_000, 1],
    [48_213, 3],
    [100_000, 5],
    [2_000_000, 5],
  ])("%d viewers → %d stars", (v, s) => expect(hypeStars(v)).toBe(s));
});

describe("hudDigits", () => {
  it("pads to 8 digits", () => expect(hudDigits(48213)).toBe("00048213"));
  it("never truncates a big number", () => expect(hudDigits(123456789)).toBe("123456789"));
  it("clamps negatives and rounds", () => {
    expect(hudDigits(-5)).toBe("00000000");
    expect(hudDigits(12.6)).toBe("00000013");
  });
});
