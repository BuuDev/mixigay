import { describe, expect, it } from "vitest";
import { WALL_MAX, wallLength } from "./limits";

describe("wallLength", () => {
  it("counts code points of the trimmed text, like char_length", () => {
    expect(wallLength("  chúc anh  ")).toBe(8);
    expect(wallLength("🔥🔥")).toBe(2);
  });
  it("keeps the 140 limit from the spec", () => {
    expect(WALL_MAX).toBe(140);
  });
});
