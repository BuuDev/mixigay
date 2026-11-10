import { describe, expect, it } from "vitest";
import { quizLinkAdminError, quizLinkInsertError } from "./errors";

describe("quizLinkInsertError", () => {
  it("maps the trigger, RLS and constraint errors", () => {
    expect(quizLinkInsertError({ code: "42501", message: "new row violates row-level security policy" })).toMatch(/khóa/);
    expect(quizLinkInsertError({ code: "P0429", message: "rate_limited_new" })).toMatch(/Tài khoản mới/);
    expect(quizLinkInsertError({ code: "P0429", message: "rate_limited" })).toMatch(/3 link/);
    expect(quizLinkInsertError({ code: "P0422", message: "too_short" })).toMatch(/ít nhất 5/);
    expect(quizLinkInsertError({ code: "23505", message: 'duplicate key value violates unique constraint "quiz_links_url_key"' })).toBe(
      "Link này đã có người gửi rồi.",
    );
    expect(quizLinkInsertError({ code: "23514", message: "check constraint" })).toMatch(/Google Forms/);
  });

  it("returns null for unknown errors", () => {
    expect(quizLinkInsertError({ code: "XX000", message: "boom" })).toBeNull();
  });
});

describe("quizLinkAdminError", () => {
  it("maps banned author, missing video and bad timestamp", () => {
    expect(quizLinkAdminError({ code: "P0001", message: "author_banned" })).toMatch(/bị cấm/);
    expect(quizLinkAdminError({ code: "23503", message: "violates foreign key constraint" })).toMatch(/chưa có trong kho/);
    expect(quizLinkAdminError({ code: "23514", message: "check" })).toMatch(/24 giờ/);
    expect(quizLinkAdminError({ code: "XX000", message: "boom" })).toBeNull();
  });
});
