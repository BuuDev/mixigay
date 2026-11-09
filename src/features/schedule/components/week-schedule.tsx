"use client";

import type { Game } from "@/features/videos/types";
import { useNow } from "@/shared/hooks/use-now";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/ui/cn";
import { DAY_NAMES, nextOccurrence, nextSlot } from "../lib/schedule";
import type { ScheduleSlot } from "../types";

// Ordered Monday-first, the way the schedule is usually announced.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function WeekSchedule({ schedule, games }: { schedule: ScheduleSlot[]; games: Game[] }) {
  const now = useNow();
  const tz = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
  const upcomingId = now ? nextSlot(schedule, now)?.slot.id : undefined;
  const gameName = (slug?: string) => games.find((g) => g.slug === slug)?.name;

  return (
    <div>
      <p className="text-sm text-muted">
        Giờ gốc theo giờ Việt Nam (UTC+7){tz && <> · hiển thị thêm giờ địa phương của bạn ({tz})</>}
      </p>
      <Card className="mt-3 divide-y divide-border overflow-hidden">
        {WEEK_ORDER.flatMap((day) => schedule.filter((s) => s.dayOfWeek === day)).map((slot) => {
          const local = now ? nextOccurrence(slot, now) : null;
          const isNext = slot.id === upcomingId;
          return (
            <div key={slot.id} className={cn("flex items-center gap-3 px-3 py-3 transition-colors sm:gap-4 sm:px-4", isNext && "bg-accent/10")}>
              <div className="w-12 shrink-0 text-sm font-semibold sm:w-20">{DAY_NAMES[slot.dayOfWeek]}</div>
              <div className="w-20 shrink-0 sm:w-28">
                <div className="font-mono tabular-nums">{slot.time}</div>
                {local && <div className="text-xs text-muted">{local.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} giờ bạn</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{slot.title}</div>
                <div className="text-xs text-muted">{[gameName(slot.gameSlug), slot.note].filter(Boolean).join(" · ")}</div>
              </div>
              {isNext && <Badge tone="accent">Kế tiếp</Badge>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
