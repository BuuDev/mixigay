import { formatDate } from "@/shared/lib/format";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { KIND_LABEL, STATUS_LABEL, type Submission, type SubmissionStatus } from "../lib/submissions";

const TONE: Record<SubmissionStatus, BadgeTone> = { approved: "cleared", rejected: "danger", pending: "accent", hidden: "muted" };

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

/** Submissions across kinds with their status; rejected ones show the reason. Never who moderated. */
export function SubmissionList({ items }: { items: Submission[] }) {
  return (
    <ul className="divide-y divide-border text-sm">
      {items.map((s) => (
        <li key={`${s.kind}:${s.id}`} className="space-y-1 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={s.status} />
            <span className="text-xs text-muted">
              {KIND_LABEL[s.kind]} · {formatDate(s.createdAt)}
            </span>
          </div>
          <p className="line-clamp-2 break-words">{s.title || "(không có tiêu đề)"}</p>
          {s.status === "rejected" && s.reason && <p className="text-xs text-muted">Lý do: {s.reason}</p>}
        </li>
      ))}
    </ul>
  );
}
