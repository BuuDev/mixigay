import { formatCountdown } from "@/features/schedule/lib/countdown";
import { DAY_NAMES } from "@/features/schedule/lib/schedule";
import { isChange } from "@/features/schedule/lib/overrides";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { Mascot } from "@/shared/ui/brand-art";
import { IconOffday } from "@/shared/ui/icons";

/** Offline on a stream day: count down to the next slot (overrides applied). */
export function NextStream({ slot, at, now, override }: { slot: ScheduleSlot; at: Date; now: Date; override?: ScheduleOverride }) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">Anh Độ đang offline. Buổi stream kế tiếp:</p>
        <h2 className="mt-1 text-xl font-extrabold">{slot.title}</h2>
        <p className="mt-1 text-sm text-muted">{at.toLocaleString("vi-VN", { weekday: "long", hour: "2-digit", minute: "2-digit" })} (giờ của bạn)</p>
        {override && isChange(override) && <p className="mt-1 text-sm text-muted">Lịch thay đổi{override.note ? `: ${override.note}` : " so với thường lệ"}</p>}
        <p className="mt-3 font-mono text-4xl font-black tracking-tight tabular-nums">{formatCountdown(at.getTime() - now.getTime())}</p>
        <p className="mt-2 text-xs text-muted">Kê ghế, pha sẵn trà đá — cầu trời tối nay không phát sinh kèo nhậu công ty PôPô.</p>
      </div>
      <Mascot pose="wait" size={96} decorative className="hidden shrink-0 sm:block" />
    </div>
  );
}

/** No stream on today's Vietnam calendar day (spec §1: Wednesday and Sunday by default, or a cancelled day via `today`). */
export function OffDay({ next, today }: { next: { slot: ScheduleSlot; at: Date } | null; today?: ScheduleOverride }) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm text-muted">
          <IconOffday size={16} />{" "}
          {today?.cancelled ? `Nghỉ đột xuất hôm nay${today.note ? `: ${today.note}` : ""}` : "Ngày nghỉ cố định (không phải trốn stream)"}
        </p>
        <h2 className="mt-1 text-xl font-extrabold">Hôm nay anh Độ nghỉ.</h2>
        {next && (
          <p className="mt-1 text-muted">
            Hẹn {next.slot.time} {DAY_NAMES[next.slot.dayOfWeek].toLowerCase()} — {next.slot.title}.
          </p>
        )}
        <p className="mt-2 text-xs text-muted">Anh em tranh thủ ngủ sớm một hôm hoặc mở lại Phòng Trà An Liễng nghe tạm nhé.</p>
      </div>
      <Mascot pose="sleep" size={96} decorative className="shrink-0" />
    </div>
  );
}
