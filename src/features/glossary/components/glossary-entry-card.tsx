import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import type { GlossaryEntry } from "../types";

/** The author's own entry waiting for review (only they see it). */
export function PendingGlossaryCard({ entry: e }: { entry: GlossaryEntry }) {
  return (
    <Card className="flex h-full flex-col gap-2 border-dashed p-3 text-sm">
      <p className="flex flex-wrap items-center gap-2 font-bold break-words">
        {e.term} <Badge tone="accent">đang chờ duyệt</Badge>
      </p>
      <p className="break-words">{e.meaning}</p>
      <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer nofollow ugc" className="mt-auto text-xs text-accent underline underline-offset-2">
        Nguồn: {e.sourceLabel} ↗
      </a>
    </Card>
  );
}
