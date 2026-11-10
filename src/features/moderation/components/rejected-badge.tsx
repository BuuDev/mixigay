/** Columns the per-type admin pages add to their select to tell rejected rows from pending ones. */
export const REJECTED_COLUMNS = "rejected_at,rejected_reason";

export interface RejectedFields {
  rejected_at?: string | null;
  rejected_reason?: string | null;
}

/** Order for per-type admin lists: pending first, then rejected (newest rejection first), then approved. */
export const PENDING_FIRST = { ascending: false, nullsFirst: true } as const;

/** Small "Đã từ chối: lý do" badge for a rejected row (kept so the author's quota is not refunded). */
export function RejectedBadge({ row }: { row: RejectedFields }) {
  if (!row.rejected_at) return null;
  return (
    <span className="mr-1 rounded bg-surface-raised px-1.5 text-xs font-semibold text-muted">
      Đã từ chối{row.rejected_reason ? `: ${row.rejected_reason}` : ""}
    </span>
  );
}
