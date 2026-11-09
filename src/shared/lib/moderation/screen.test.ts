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
