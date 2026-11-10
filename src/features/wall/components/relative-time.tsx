"use client";

import { useNow } from "@/shared/hooks/use-now";
import { relativeTime } from "../lib/relative-time";

/** "5 phút trước"; the date until hydration, since "now" depends on the viewer's clock. */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const now = useNow("minute");
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {now ? relativeTime(iso, now) : new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
    </time>
  );
}
