"use client";

import type { Game } from "@/features/videos/types";
import { useNow } from "@/shared/hooks/use-now";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { DAY_NAMES, nextSlot } from "../lib/schedule";
import { nextRowKey, weekRows, type WeekRow } from "../lib/week";
import type { ScheduleOverride, ScheduleSlot } from "../types";

// Ordered Monday-first, the way the schedule is usually announced.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const BADGE: Record<Exclude<WeekRow["kind"], "regular">, { tone: "muted" | "steam"; text: string }> = {
  cancelled: { tone: "muted", text: "Nghỉ tuần này" },
  changed: { tone: "steam", text: "Đổi giờ" },
  extra: { tone: "steam", text: "Live thêm" },
};

/**
 * The weekly schedule, Monday first. Once the viewer's clock is known it shows
 * this week's dates with one-day exceptions applied (day off, moved time, extra
 * stream); before that (server render) it lists the regular slots.
 */
export function WeekSchedule({ schedule, games, overrides }: { schedule: ScheduleSlot[]; games: Game[]; overrides?: ScheduleOverride[] }) {
  const now = useNow("minute");
  const tz = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
  const dated = now ? weekRows(schedule, now, overrides) : null;
  const rows: (Omit<WeekRow, "at" | "day"> & { at?: Date; day?: Date })[] =
    dated ??
    WEEK_ORDER.flatMap((day) => schedule.filter((s) => s.dayOfWeek === day)).map((slot) => ({ key: slot.id, dateVn: "", slot, kind: "regular" as const }));
  const nextKey = dated && now ? nextRowKey(dated, nextSlot(schedule, now, overrides)) : undefined;
  const gameName = (slug?: string) => games.find((g) => g.slug === slug)?.name;

  return (
    <div>
      <p className="text-sm text-muted">Giờ gốc theo giờ Việt Nam (UTC+7){tz && <> · hiển thị thêm giờ địa phương của bạn ({tz})</>}</p>
      <Card className="mt-3 divide-y divide-border overflow-hidden">
        {rows.map((row) => {
          const { slot, kind, at, day } = row;
          const isNext = row.key === nextKey;
          const cancelled = kind === "cancelled";
          const badge = kind === "regular" ? null : BADGE[kind];
          const extra = [
            cancelled ? row.override?.note : null,
            kind === "changed" && row.original ? `Giờ thường lệ ${row.original.time}` : null,
            gameName(slot.gameSlug),
            slot.note,
          ].filter(Boolean);
          return (
            <div key={row.key} className={cn("flex items-center gap-3 px-3 py-3 transition-colors sm:gap-4 sm:px-4", isNext && "bg-accent/5")}>
              <div className="w-12 shrink-0 text-sm font-semibold sm:w-20">
                {DAY_NAMES[slot.dayOfWeek]}
                {day && <div className="text-xs font-normal text-muted">{`${day.getUTCDate()}/${day.getUTCMonth() + 1}`}</div>}
              </div>
              <div className="w-20 shrink-0 sm:w-28">
                <div className={cn("font-mono tabular-nums", cancelled && "text-muted line-through")}>{slot.time}</div>
                {at && !cancelled && <div className="text-xs text-muted">{at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} giờ bạn</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("font-medium", cancelled && "text-muted")}>{slot.title}</div>
                <div className="text-xs text-muted">{extra.join(" · ")}</div>
              </div>
              {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
              {isNext && <Badge tone="accent">Kế tiếp</Badge>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
