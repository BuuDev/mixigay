import { describe, expect, it } from "vitest";
import { isTermCategory, normalizeTerm, TermInput } from "./terms";

describe("normalizeTerm", () => {
  it("lower-cases, trims and squeezes spaces, keeps Vietnamese marks", () => {
    expect(normalizeTerm("  Nhà   CÁI ")).toBe("nhà cái");
  });
  it("composes decomposed marks (NFC)", () => {
    expect(normalizeTerm("đéo")).toBe("đéo");
  });
});

describe("TermInput", () => {
  it("accepts a valid term", () => expect(TermInput.parse({ term: " Kèo Thơm ", category: "spam" })).toEqual({ term: "kèo thơm", category: "spam" }));
  it("rejects too short / too long terms and unknown categories", () => {
    expect(TermInput.safeParse({ term: " a ", category: "spam" }).success).toBe(false);
    expect(TermInput.safeParse({ term: "x".repeat(61), category: "spam" }).success).toBe(false);
    expect(TermInput.safeParse({ term: "abc", category: "other" }).success).toBe(false);
  });
  it("knows the categories", () => {
    expect(isTermCategory("gambling")).toBe(true);
    expect(isTermCategory("domain")).toBe(false);
  });
});
