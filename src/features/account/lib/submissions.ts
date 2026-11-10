// Fan submissions across the seven moderated tables (supabase/migrations/20261110200000_moderation_center.sql).
// Shared by the fan's own history (/tai-khoan) and the admin user page (/admin/nguoi-dung).

export const CONTENT_KINDS = [
  { kind: "suggestion", table: "suggestions", title: "name", label: "Đề xuất game" },
  { kind: "fan_song", table: "fan_songs", title: "title", label: "Nhạc nịnh" },
  { kind: "fan_art", table: "fan_art", title: "title", label: "Fan art" },
  { kind: "quiz_link", table: "quiz_links", title: "title", label: "Link quiz" },
  { kind: "quote", table: "quotes", title: "body", label: "Quote" },
  { kind: "glossary_entry", table: "glossary_entries", title: "term", label: "Từ điển" },
  { kind: "wall_message", table: "wall_messages", title: "body", label: "Bức tường" },
] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number]["kind"];
export type LogKind = ContentKind | "profile";

export const KIND_LABEL: Record<LogKind, string> = {
  ...(Object.fromEntries(CONTENT_KINDS.map((k) => [k.kind, k.label])) as Record<ContentKind, string>),
  profile: "Tài khoản",
};

export const isLogKind = (k: string): k is LogKind => k in KIND_LABEL;

/** Columns to select from a kind's table (the title column differs per table; `hidden` is admin-only). */
export function submissionColumns(kind: (typeof CONTENT_KINDS)[number], audience: "author" | "admin"): string {
  return `id,${kind.title},approved,rejected_at,rejected_reason,created_at${audience === "admin" && kind.kind === "suggestion" ? ",hidden" : ""}`;
}

export type SubmissionStatus = "approved" | "rejected" | "pending" | "hidden";

export interface Submission {
  id: string;
  kind: ContentKind;
  title: string;
  createdAt: string;
  status: SubmissionStatus;
  reason: string | null;
}

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
  pending: "Đang chờ duyệt",
  hidden: "Đã ẩn",
};

type Row = Record<string, unknown>;

/**
 * Status of one row. `audience: "author"` never reports "hidden": a shadow ban hides the
 * author's posts on insert, and telling them would give the ban away.
 */
export function submissionStatus(row: Row, audience: "author" | "admin"): { status: SubmissionStatus; reason: string | null } {
  if (row.rejected_at)
    return { status: "rejected", reason: typeof row.rejected_reason === "string" && row.rejected_reason.trim() ? row.rejected_reason : null };
  if (audience === "admin" && row.hidden === true) return { status: "hidden", reason: null };
  if (row.approved === true) return { status: "approved", reason: null };
  return { status: "pending", reason: null };
}

/** Rows of one table → submissions; rows without an id or date are dropped. */
export function mapSubmissions(kind: (typeof CONTENT_KINDS)[number], rows: Row[], audience: "author" | "admin"): Submission[] {
  return rows.flatMap((r) => {
    if (typeof r.id !== "string" || typeof r.created_at !== "string") return [];
    const title = typeof r[kind.title] === "string" ? (r[kind.title] as string) : "";
    return [{ id: r.id, kind: kind.kind, title, createdAt: r.created_at, ...submissionStatus(r, audience) }];
  });
}

/** Newest first across kinds, at most `limit`. */
export function latestSubmissions(lists: Submission[][], limit: number): Submission[] {
  return lists
    .flat()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}
