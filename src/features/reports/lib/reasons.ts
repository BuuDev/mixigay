// Mirrors the CHECK constraints of public.reports (latest definition: supabase/migrations/20261110160000_quiz_links_song_art.sql).
export type ReportKind = "suggestion" | "fan_song" | "profile" | "wall_message" | "quote" | "glossary_entry" | "quiz_link";
export type ReportReason = "spam" | "gambling" | "offensive" | "impersonation" | "other";

export const REPORT_KINDS: readonly ReportKind[] = ["suggestion", "fan_song", "profile", "wall_message", "quote", "glossary_entry", "quiz_link"];

export const REASON_LABEL: Record<ReportReason, string> = {
  spam: "Spam, rác, trùng lặp",
  gambling: "Quảng cáo cá độ, cờ bạc, link lạ",
  offensive: "Tục tĩu, xúc phạm, thiếu tôn trọng",
  impersonation: "Mạo danh anh Độ / Kênh MixiGaming",
  other: "Lý do khác",
};

export const REASONS = Object.keys(REASON_LABEL) as ReportReason[];

export const KIND_LABEL: Record<ReportKind, string> = {
  suggestion: "Đề xuất",
  fan_song: "Nhạc nịnh",
  profile: "Tên hiển thị",
  wall_message: "Lời nhắn trên tường",
  quote: "Quote",
  glossary_entry: "Từ fan góp",
  quiz_link: "Link quiz",
};
