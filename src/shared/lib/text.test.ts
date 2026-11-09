import { describe, expect, it } from "vitest";
import { normalizeName, safeHttpUrl } from "./text";

describe("normalizeName", () => {
  it("strips Vietnamese diacritics and punctuation", () => {
    expect(normalizeName("Bán Trà Sữa Đường Phố!")).toBe("bantrasuaduongpho");
    expect(normalizeName("R.E.P.O.")).toBe("repo");
  });
});

describe("safeHttpUrl", () => {
  it("accepts http(s) links", () => {
    expect(safeHttpUrl(" https://itch.io/x ")).toBe("https://itch.io/x");
  });
  it("rejects other schemes and garbage", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpUrl("not a url")).toBeUndefined();
    expect(safeHttpUrl("")).toBeUndefined();
  });
});
