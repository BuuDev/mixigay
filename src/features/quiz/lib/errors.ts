import { QUIZ_DESCRIPTION_MAX, QUIZ_PLATFORM_LIST, QUIZ_TITLE_MAX, QUIZ_TITLE_MIN } from "./quiz-url";

/** Friendly message for the guards in limit_quiz_links(), RLS and constraints, or null for other errors. */
export function quizLinkInsertError(error: { code?: string; message: string }): string | null {
  if (error.code === "42501") return "Tài khoản này đã bị khóa gửi nội dung.";
  if (error.message.includes("rate_limited_new")) return "Tài khoản mới gửi tối đa 1 link quiz trong ngày đầu, mai quay lại nhé.";
  if (error.message.includes("rate_limited")) return "Bạn đã gửi 3 link quiz hôm nay, mai quay lại nhé.";
  if (error.message.includes("too_short")) return `Tên quiz ít nhất ${QUIZ_TITLE_MIN} ký tự.`;
  if (error.code === "23505") return "Link này đã có người gửi rồi.";
  if (error.code === "23514")
    return `Tên quiz từ ${QUIZ_TITLE_MIN} đến ${QUIZ_TITLE_MAX} ký tự, mô tả tối đa ${QUIZ_DESCRIPTION_MAX} ký tự, link quiz trên ${QUIZ_PLATFORM_LIST}.`;
  return null;
}

/** Friendly message when an admin write is refused, or null. */
export function quizLinkAdminError(error: { code?: string; message: string }): string | null {
  if (error.message.includes("author_banned")) return "Người gửi link này đang bị cấm: bỏ cấm trước rồi mới duyệt được.";
  if (error.code === "23503") return "Video này chưa có trong kho của Góc Bộ Tộc. Chỉ gắn được video trên kênh của anh Độ.";
  if (error.code === "23514") return "Mốc thời gian phải trong vòng 24 giờ.";
  return null;
}
