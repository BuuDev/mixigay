import { describe, expect, it } from "vitest";
import { accountAge, approveErrorMessage, composeReason, groupRefs, inboxHref, itemRef, parseInboxQuery, parseItemRef, REASON_MAX, trustLabel } from "./review";

const ID = "11111111-1111-4111-8111-111111111111";

describe("composeReason", () => {
  it("preset alone, preset + note, Khác uses the note", () => {
    expect(composeReason("Trùng lặp", "")).toBe("Trùng lặp");
    expect(composeReason("Spam / quảng cáo", "  link  shop ")).toBe("Spam / quảng cáo: link shop");
    expect(composeReason("Khác", "Sai game")).toBe("Sai game");
    expect(composeReason("Khác", "")).toBe("Khác");
  });

  it("unknown preset falls back to Khác, length capped", () => {
    expect(composeReason("<script>", "x")).toBe("x");
    expect([...composeReason("Trùng lặp", "a".repeat(400))].length).toBe(REASON_MAX);
  });
});

describe("item refs", () => {
  it("round-trips and validates", () => {
    expect(parseItemRef(itemRef("quote", ID))).toEqual({ kind: "quote", id: ID });
    expect(parseItemRef(`profile:${ID}`)).toBeNull();
    expect(parseItemRef("quote:not-a-uuid")).toBeNull();
    expect(parseItemRef(ID)).toBeNull();
    expect(parseItemRef(null)).toBeNull();
  });

  it("groups per kind without duplicates", () => {
    const g = groupRefs([
      { kind: "quote", id: ID },
      { kind: "quote", id: ID },
      { kind: "wall_message", id: ID },
    ]);
    expect(g.get("quote")).toEqual([ID]);
    expect(g.get("wall_message")).toEqual([ID]);
  });
});

describe("accountAge", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  it("picks the largest unit", () => {
    expect(accountAge("2026-11-10T11:59:30Z", now)).toBe("vừa tạo");
    expect(accountAge("2026-11-10T11:55:00Z", now)).toBe("tạo 5 phút trước");
    expect(accountAge("2026-11-10T10:00:00Z", now)).toBe("tạo 2 giờ trước");
    expect(accountAge("2026-11-07T12:00:00Z", now)).toBe("tạo 3 ngày trước");
    expect(accountAge("2025-11-01T12:00:00Z", now)).toBe("tạo 1 năm trước");
    expect(accountAge("garbage", now)).toBe("không rõ ngày tạo");
  });
});

describe("trustLabel / approveErrorMessage", () => {
  it("labels trust states", () => {
    expect(trustLabel(-1)).toBe("đang bị cấm");
    expect(trustLabel(-2)).toBe("đang bị cấm ngầm");
    expect(trustLabel(0)).toBeUndefined();
    expect(trustLabel(undefined)).toBeUndefined();
  });

  it("friendly messages for banned authors and duplicates", () => {
    expect(approveErrorMessage("wall_message", { code: "P0403", message: "x" })).toContain("bị cấm");
    expect(approveErrorMessage("quiz_link", { code: "P0001", message: "author_banned" })).toContain("bị cấm");
    expect(approveErrorMessage("quote", { code: "23505", message: "dup" })).toContain("giây");
    expect(approveErrorMessage("fan_art", { code: "42P01", message: "boom" })).toBeNull();
  });
});

describe("parseInboxQuery / inboxHref", () => {
  it("validates kind and clamps n", () => {
    expect(parseInboxQuery({})).toEqual({ kind: undefined, limit: 50 });
    expect(parseInboxQuery({ kind: "quote", n: "100" })).toEqual({ kind: "quote", limit: 100 });
    expect(parseInboxQuery({ kind: "profile", n: "9999" })).toEqual({ kind: undefined, limit: 300 });
    expect(parseInboxQuery({ kind: ["fan_art", "quote"], n: "-5" })).toEqual({ kind: "fan_art", limit: 50 });
    expect(parseInboxQuery({ n: "70" }).limit).toBe(100);
  });

  it("builds links without defaults", () => {
    expect(inboxHref(undefined)).toBe("/admin/duyet");
    expect(inboxHref("quote")).toBe("/admin/duyet?kind=quote");
    expect(inboxHref(undefined, 100)).toBe("/admin/duyet?n=100");
  });
});
