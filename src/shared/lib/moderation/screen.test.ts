import { describe, expect, it } from "vitest";
import { collapse, plain, unleet } from "./normalize";
import { screenText } from "./screen";

describe("normalize", () => {
  it("removes diacritics and invisible characters, maps look-alikes", () => {
    expect(plain("Nổ  Hũ​")).toBe("no hu");
    expect(plain("nhасаi")).toBe("nhacai"); // Cyrillic а, с
  });
  it("undoes leetspeak only next to letters", () => {
    expect(unleet("c4 d0 nhacai88")).toBe("ca do nhacai88");
  });
  it("joins letters spread out with separators", () => {
    expect(collapse("vao n.h.a c.a.i ngay")).toBe("vao nhacai ngay");
    expect(collapse("t a i x i u")).toBe("taixiu");
  });
});

describe("screenText — must block", () => {
  it.each([
    "Vào nhacai88 nhận 88k",
    "NH4 C4I uy tín",
    "n.h.a c.a.i 123",
    "nhасаi88 . com", // Cyrillic
    "Game hay lắm, tải ở bit.ly/abc",
    "đm game như cứt",
    "dmm thằng độ",
    "sunwin đổi thưởng",
    "t-a-i x-i-u online",
  ])("%s", (text) => expect(screenText([text]).verdict).toBe("block"));
});

describe("screenText — must flag for review", () => {
  it("gambling phrase without a brand", () => expect(screenText(["nạp tiền hoàn trả 10%"])).toMatchObject({ verdict: "review", flags: ["gambling"] }));
  it("a domain written in the text", () => expect(screenText(["xem thêm ở mygame . net"]).flags).toContain("domain"));
});

describe("screenText — normal Vietnamese stays ok", () => {
  it.each([
    "Các bạn buổi tối vui vẻ",
    "Game lớn, đồ họa đẹp, chơi co-op 4 người",
    "Dota 2 nhưng vui hơn",
    "Nhạc ai hát mà hay thế",
    "Ca dao tục ngữ Việt Nam",
    "Anh Độ chơi thử đi, độ khó vừa phải",
    "Thắng đó là nhờ đồng đội",
    "Đi đâu cũng mang theo cái đèn",
    "Bán Trà Sữa Simulator",
    "Lethal Company",
    "R.E.P.O. – chơi nhóm",
  ])("%s", (text) => expect(screenText([text]).verdict).toBe("ok"));
});

describe("screenText — admin-managed extra terms", () => {
  const extra = [
    { term: "cá độ", category: "gambling" },
    { term: "kèo thơm", category: "spam" },
    { term: "xoilac", category: "spam" },
    { term: "đĩ", category: "profanity" },
    { term: "ngu học", category: "profanity" },
  ] as const;

  it("keeps the old signature working", () => {
    expect(screenText(["Các bạn buổi tối vui vẻ"]).verdict).toBe("ok");
    expect(screenText(["Các bạn buổi tối vui vẻ"], []).verdict).toBe("ok");
  });

  it.each([
    "Vào đây cá độ nha",
    "CÁ ĐỘ uy tín",
    "ca do bong da", // diacritics dropped
    "c4 d0 bóng đá", // teencode
    "c.a d.o", // spread out
    "kèo thơm mỗi ngày",
    "keo thom", // spam terms match without marks too
    "xem trên x0ilac", // leet
    "xem trên x.o.i.l.a.c",
    "đồ con đĩ",
    "đồ ngu học",
  ])("blocks %s", (text) => expect(screenText([text], extra).verdict).toBe("block"));

  it.each([
    "Đi chơi game thôi", // "đĩ" plain is "di": profanity with marks matches marked only
    "Di chuyển nhanh lên",
    "Cà độc dược", // "ca do" only as a whole word
  ])("leaves %s alone", (text) => expect(screenText([text], extra).verdict).toBe("ok"));

  it("flags the category of the matched term, spam included (reviewers see a badge)", () => {
    expect(screenText(["cá độ"], extra).flags).toContain("gambling");
    expect(screenText(["đĩ"], extra).flags).toContain("profanity");
    expect(screenText(["xoilac"], extra)).toEqual({ verdict: "block", flags: ["spam"] });
  });

  it("normalises the stored term too and ignores too-short ones", () => {
    expect(screenText(["vào CASINOX ngay"], [{ term: " CasinoX ", category: "spam" }]).verdict).toBe("block");
    expect(screenText(["a b c"], [{ term: "a", category: "spam" }]).verdict).toBe("ok");
  });
});
