"use client";

import { useNow } from "@/shared/hooks/use-now";
import { isPollOpen } from "../lib/results";
import type { PollStatus } from "../types";

const STATUS_LABEL: Record<PollStatus, string> = { draft: "Nháp", open: "Đang mở", closed: "Đã đóng" };

/** Status pill; an open poll past its closes_at reads "Hết giờ" (fans can no longer vote). */
export function PollStateBadge({ status, closesAt }: { status: PollStatus; closesAt: string | null }) {
  const now = useNow("minute");
  const expired = status === "open" && now !== null && !isPollOpen({ status, closesAt }, now);
  return <span className="rounded-full border border-border px-2 py-0.5 text-xs">{expired ? "Hết giờ" : STATUS_LABEL[status]}</span>;
}
