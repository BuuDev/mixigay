"use client";

import { useState } from "react";
import { DAY_NAMES } from "@/features/schedule/lib/schedule";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { useNow } from "@/shared/hooks/use-now";
import { m, pop, press } from "@/shared/motion";
import { Burst } from "@/shared/motion/burst";
import { CountUp } from "@/shared/motion/count-up";
import { cn } from "@/shared/ui/cn";
import { IconAttend, IconTribe } from "@/shared/ui/icons";
import { useAttendance } from "../hooks/use-attendance";
import { tonightPlan } from "../lib/tonight";
import type { AttendanceSnapshot } from "../types";

const number = new Intl.NumberFormat("vi-VN");

/**
 * Spec §4 — "Tối nay tôi có mặt": a big button that turns into "Đã hẹn ✓" and a
 * line with how many of the Bộ Tộc are in for tonight's stream. On a day off it
 * says so and shows the next stream instead.
 */
export function AttendButton({ schedule, overrides, snapshot }: { schedule: ScheduleSlot[]; overrides?: ScheduleOverride[]; snapshot: AttendanceSnapshot }) {
  const now = useNow("minute");
  const plan = now ? tonightPlan(schedule, overrides, now) : null;
  const { attended, count, signedIn, pending, notice, tap } = useAttendance(snapshot, plan?.dateVn ?? null);
  const [burst, setBurst] = useState(0);

  if (plan?.kind === "off") {
    const next = plan.next;
    return (
      <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
        <p className="font-semibold">Hôm nay anh Độ nghỉ live, Bộ Tộc nghỉ ngơi nhé.</p>
        {next && (
          <p className="text-sm text-muted">
            Buổi tới: {DAY_NAMES[next.slot.dayOfWeek]} · {next.slot.time} (giờ Việt Nam)
          </p>
        )}
      </div>
    );
  }

  const time = plan?.time;
  const guestLocked = !signedIn && attended;

  function onTap() {
    if (tap()) setBurst((b) => b + 1);
  }

  return (
    <div className="flex min-h-36 flex-col items-center gap-3 text-center">
      <span className="relative inline-block">
        <m.button
          type="button"
          onClick={onTap}
          aria-pressed={attended}
          aria-disabled={guestLocked || undefined}
          {...press}
          className={cn(
            "inline-flex min-h-14 min-w-64 items-center justify-center gap-2 rounded-pill px-8 py-3 text-lg font-semibold transition-colors",
            attended ? "border border-cleared/60 bg-surface text-cleared" : "bg-accent text-background hover:bg-accent-glow",
            guestLocked && "cursor-default",
          )}
        >
          {attended ? (
            <m.span key="done" variants={pop} initial={burst > 0 ? "hidden" : false} animate="visible" className="inline-flex items-center gap-2">
              Đã hẹn ✓
            </m.span>
          ) : (
            <>
              <IconAttend size={26} />
              Tối nay tôi có mặt
            </>
          )}
        </m.button>
        {burst > 0 && <Burst key={burst} count={14} distance={90} />}
      </span>

      <p className="flex items-center justify-center gap-2 text-sm text-muted" aria-live="polite">
        <IconTribe size={20} className="text-accent" />
        {count > 0 ? (
          <span>
            <CountUp value={count} format={(n) => number.format(Math.round(n))} className="font-bold text-foreground tabular-nums" /> người Bộ Tộc đã hẹn{" "}
            {time ?? "tối nay"}
          </span>
        ) : (
          <span>Chưa ai hẹn {time ?? "tối nay"}, mở hàng cho Bộ Tộc nhé</span>
        )}
      </p>

      {signedIn && attended && !pending && <p className="text-xs text-muted">Đổi ý thì bấm lại để hủy hẹn.</p>}
      {!signedIn && <p className="text-xs text-muted">Khách chỉ được ghi nhớ trên máy này. Vào Bộ Tộc để được tính vào số người hẹn.</p>}
      {notice && (
        <p role="status" className="text-sm text-live-text">
          {notice}
        </p>
      )}
    </div>
  );
}
