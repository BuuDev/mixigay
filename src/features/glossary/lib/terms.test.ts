import { describe, expect, it } from "vitest";
import { termKeys, withoutCuratedTerms } from "./terms";

describe("termKeys", () => {
  it("ignores case, diacritics, quotes and spaces, and splits aliases on “·”", () => {
    expect(termKeys("Lươn Cao Bằng · “Hí anh em”")).toEqual(["luoncaobanghianhem", "luoncaobang", "hianhem"]);
    expect(termKeys("Tộc Trưởng")).toEqual(["toctruong"]);
  });
});

describe("withoutCuratedTerms", () => {
  const curated = ["Tộc Trưởng", "Lươn Cao Bằng · “Hí anh em”"];
  it("drops fan entries that repeat a curated term or alias", () => {
    const fan = [{ term: "toc truong" }, { term: "Hí anh em!" }, { term: "Đồ Tể Mixi" }];
    expect(withoutCuratedTerms(fan, curated)).toEqual([{ term: "Đồ Tể Mixi" }]);
  });
  it("keeps everything when nothing clashes", () => {
    expect(withoutCuratedTerms([{ term: "Moi Xoang" }], curated)).toHaveLength(1);
  });
});
