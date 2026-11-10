import { QUOTE_MAX, QUOTE_MIN } from "./limits";

/** Friendly message for the guards in limit_quotes(), RLS and constraints, or null for other errors. */
export function quoteInsertError(error: { code?: string; message: string }): string | null {
  if (error.code === "42501") return "Tài khoản này đã bị khóa gửi nội dung.";
  if (error.message.includes("rate_limited_new")) return "Tài khoản mới gửi tối đa 1 quote trong ngày đầu, mai quay lại nhé.";
  if (error.message.includes("rate_limited")) return "Bạn đã gửi 5 quote hôm nay, mai quay lại nhé.";
  if (error.message.includes("too_short")) return `Quote ít nhất ${QUOTE_MIN} ký tự.`;
  if (error.code === "23503") return "Video này chưa có trong kho của Góc Bộ Tộc. Chỉ nhận video trên kênh của anh Độ.";
  if (error.code === "23514") return `Quote từ ${QUOTE_MIN} đến ${QUOTE_MAX} ký tự, mốc thời gian trong vòng 24 giờ.`;
  return null;
}

/** Friendly message when an admin approval is refused, or null. */
export function quoteApproveError(error: { code?: string; message: string }): string | null {
  if (error.message.includes("author_banned")) return "Tác giả quote này đang bị cấm: bỏ cấm trước rồi mới duyệt được.";
  if (error.code === "23505") return "Đã có một quote được duyệt ở đúng giây này của video. Gỡ duyệt quote kia trước nếu muốn thay.";
  return null;
}
