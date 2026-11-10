"use client";

import { PresenceDot } from "./presence-dot";
import { cn } from "@/shared/ui/cn";
import { useTribeOnline } from "../hooks/use-tribe-room";

/** "● 128 online" for the header / live dock. Renders nothing until the room has a count. */
export function TribeRoomBadge({ className }: { className?: string }) {
  const online = useTribeOnline();
  if (online === null) return null;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-pill bg-cleared/15 px-2.5 py-0.5 text-xs font-semibold text-cleared tabular-nums", className)}
    >
      <PresenceDot className="size-2" />
      {online.toLocaleString("vi-VN")} online
      <span className="sr-only"> (người Bộ Tộc đang ở trên trang)</span>
    </span>
  );
}
