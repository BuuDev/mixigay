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

/** One note on the wall. `pending` marks the author's own message that only they can see. */
export function WallMessageCard({ message: w, pending = false, className }: { message: WallMessage; pending?: boolean; className?: string }) {
  return (
    <Card className={cn("flex h-full flex-col justify-between gap-3 p-4", pending && "border-dashed", className)}>
      <p className="text-base leading-relaxed break-words">“{w.body}”</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span className="font-semibold text-foreground">{w.author}</span>
        {w.authorVerified && <VerifiedMark />}
        <span aria-hidden>·</span>
        <RelativeTime iso={w.createdAt} />
        {pending && <Badge tone="accent">đang chờ duyệt</Badge>}
      </p>
    </Card>
  );
}
