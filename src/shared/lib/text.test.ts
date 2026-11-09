import { describe, expect, it } from "vitest";
import { normalizeName, safeHttpUrl, slugify } from "./text";

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

describe("slugify", () => {
  it("makes Vietnamese titles URL-safe", () => {
    expect(slugify("Phòng Trà An Liễng")).toBe("phong-tra-an-lieng");
    expect(slugify("  Độ đi date!! ")).toBe("do-di-date");
    expect(slugify("GTA V 2026")).toBe("gta-v-2026");
  });
});
