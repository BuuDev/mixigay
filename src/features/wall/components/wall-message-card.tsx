import { ReportButton } from "@/features/reports/components/report-button";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import type { WallMessage } from "../types";
import { RelativeTime } from "./relative-time";

export function VerifiedMark() {
  return (
    <span className="rounded bg-cleared/15 px-1.5 text-xs font-semibold text-cleared" title="Tài khoản đã xác minh là anh Độ / team Kênh MixiGaming">
      ✓ Chính chủ
    </span>
  );
}

/**
 * One note on the wall. `pending` marks the author's own message that only they can see.
 * Approved notes get a "Báo cáo" link; demo data has no author id, so it reports in demo mode.
 */
export function WallMessageCard({ message: w, pending = false, className }: { message: WallMessage; pending?: boolean; className?: string }) {
  return (
    <Card className={cn("flex h-full flex-col justify-between gap-3 p-4", pending && "border-dashed", className)}>
      <p className="text-base leading-relaxed break-words">“{w.body}”</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="font-semibold text-foreground">{w.author}</span>
        {w.authorVerified && <VerifiedMark />}
        <span aria-hidden>·</span>
        <RelativeTime iso={w.createdAt} />
        {pending && <Badge tone="accent">đang chờ duyệt</Badge>}
        {!pending && w.approved && (
          <span className="ml-auto">
            <ReportButton kind="wall_message" targetId={w.id} authorId={w.authorId} demo={!w.authorId} />
          </span>
        )}
      </div>
    </Card>
  );
}
