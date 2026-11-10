import { describe, expect, it } from "vitest";
import { quoteApproveError, quoteInsertError } from "./errors";

describe("quoteInsertError", () => {
  it("maps the trigger and RLS guards", () => {
    expect(quoteInsertError({ code: "42501", message: "new row violates row-level security policy" })).toContain("bị khóa");
    expect(quoteInsertError({ code: "P0429", message: "rate_limited_new" })).toContain("Tài khoản mới");
    expect(quoteInsertError({ code: "P0429", message: "rate_limited" })).toContain("5 quote");
    expect(quoteInsertError({ code: "P0422", message: "too_short" })).toContain("ít nhất 5");
    expect(quoteInsertError({ code: "23503", message: "violates foreign key constraint" })).toContain("chưa có trong kho");
    expect(quoteInsertError({ code: "23514", message: "violates check constraint" })).toContain("200");
  });
  it("returns null for unknown errors", () => {
    expect(quoteInsertError({ code: "XX000", message: "boom" })).toBeNull();
  });
});

describe("quoteApproveError", () => {
  it("maps banned authors and duplicate moments", () => {
    expect(quoteApproveError({ code: "P0001", message: "author_banned" })).toContain("bị cấm");
    expect(quoteApproveError({ code: "23505", message: "duplicate key value violates unique constraint" })).toContain("đúng giây");
    expect(quoteApproveError({ code: "XX000", message: "boom" })).toBeNull();
  });
});
