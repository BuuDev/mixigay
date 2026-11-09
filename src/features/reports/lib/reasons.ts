// Mirrors the CHECK constraints of public.reports (supabase/migrations/20261110110000_reports_song_votes_steam.sql).
export type ReportKind = "suggestion" | "fan_song" | "profile";
export type ReportReason = "spam" | "gambling" | "offensive" | "impersonation" | "other";

export const REPORT_KINDS: readonly ReportKind[] = ["suggestion", "fan_song", "profile"];

export const REASON_LABEL: Record<ReportReason, string> = {
  spam: "Spam, rác, trùng lặp",
  gambling: "Quảng cáo cá độ, cờ bạc, link lạ",
  offensive: "Tục tĩu, xúc phạm, thiếu tôn trọng",
  impersonation: "Mạo danh anh Độ / Kênh MixiGaming",
  other: "Lý do khác",
};

export const REASONS = Object.keys(REASON_LABEL) as ReportReason[];

export const KIND_LABEL: Record<ReportKind, string> = { suggestion: "Đề xuất", fan_song: "Nhạc nịnh", profile: "Tên hiển thị" };
