import { connection } from "next/server";
import { Suspense } from "react";
import { getSchedule, getScheduleOverrides } from "@/features/schedule/server/queries";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import { IconCleared, IconKindle } from "@/shared/ui/icons";
import { BADGES, computeStreak, nextBadge, unlockedBadges } from "../lib/streak";
import { getMyAttendanceDates } from "../server/queries";

/**
 * Compact "Chuỗi có mặt" of the signed-in viewer (their own rows only, never other
 * fans'), for /tai-khoan: run, record, total, earned badges and the next one.
 * Reads the session and the clock, so it streams in under its own <Suspense>.
 */
export function StreakBadge({ userId, className }: { userId: string; className?: string }) {
  return (
    <Suspense fallback={<p className={cn("min-h-20 text-sm text-muted", className)}>Đang đếm chuỗi có mặt…</p>}>
      <Streak userId={userId} className={className} />
    </Suspense>
  );
}

async function Streak({ userId, className }: { userId: string; className?: string }) {
  await connection(); // "today" is read at request time, never prerendered
  const [schedule, overrides, dates] = await Promise.all([getSchedule(), getScheduleOverrides(), getMyAttendanceDates(userId)]);
  const stats = computeStreak(dates, schedule, overrides, new Date());
  const earned = new Set(unlockedBadges(stats).map((b) => b.id));
  const next = nextBadge(stats);
  return (
    <section className={cn("min-h-20 space-y-3", className)} aria-labelledby="streak-badge-title">
      <div className="flex items-center gap-3">
        <span
          className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15", stats.current > 0 ? "text-accent" : "text-muted")}
        >
          <IconKindle size={28} />
        </span>
        <div className="min-w-0">
          <h2 id="streak-badge-title" className="font-semibold">
            {stats.current > 0 ? `Chuỗi ${stats.current} buổi liên tiếp` : "Chuỗi có mặt"}
          </h2>
          <p className="text-xs text-muted">
            {stats.total > 0 ? `Kỷ lục ${stats.best} buổi · Tổng ${stats.total} buổi` : "Bấm “Tối nay tôi có mặt” ở trang chủ để bắt đầu."}
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Huy hiệu có mặt">
        {BADGES.map((b) => {
          const has = earned.has(b.id);
          return (
            <li key={b.id}>
              <Badge tone={has ? "accent" : "muted"} icon={<IconCleared size={14} />}>
                {b.name}
                <span className="sr-only">{has ? " (đã có)" : ` (chưa có: ${b.hint})`}</span>
              </Badge>
            </li>
          );
        })}
      </ul>
      {next && (
        <p className="text-xs text-muted">
          Còn {next.remaining} buổi{next.badge.basis === "streak" ? " liên tiếp" : ""} nữa đến «{next.badge.name}».
        </p>
      )}
    </section>
  );
}
