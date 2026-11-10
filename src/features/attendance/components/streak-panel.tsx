"use client";

import { AnimatePresence, m, pop, spring } from "@/shared/motion";
import { Burst } from "@/shared/motion/burst";
import { IconCleared, IconClose } from "@/shared/ui/icons";
import { nextBadge, unlockedBadges, type StreakBadgeDef, type StreakStats } from "../lib/streak";
import { StreakFlame } from "./streak-flame";

/**
 * The viewer's own "Chuỗi có mặt" under the RSVP button: flame, run length, record
 * and total, and a bar to the next badge. Personal only — nothing about other fans.
 */
export function StreakPanel({ stats, signedIn }: { stats: StreakStats; signedIn: boolean }) {
  const next = nextBadge(stats);
  const earned = unlockedBadges(stats);
  return (
    <div className="mx-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left">
      <StreakFlame streak={stats.current} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-semibold">
          {stats.current > 0 ? (
            <>
              Chuỗi <span className="text-accent tabular-nums">{stats.current}</span> buổi liên tiếp
            </>
          ) : stats.total > 0 ? (
            "Tối nay có mặt để nhóm lại ngọn lửa nhé"
          ) : (
            "Bấm “Tối nay tôi có mặt” để nhóm ngọn lửa đầu tiên"
          )}
        </p>
        {stats.total > 0 && (
          <p className="text-xs text-muted">
            Kỷ lục {stats.best} buổi · Tổng {stats.total} buổi
            {earned.length > 0 && ` · ${earned[earned.length - 1].name}`}
          </p>
        )}
        {stats.atRisk && <p className="text-xs text-accent-glow">Tối nay có mặt để giữ lửa cho chuỗi.</p>}
        {next ? (
          <div>
            <div
              className="h-1.5 overflow-hidden rounded-pill bg-surface-raised"
              role="progressbar"
              aria-label={`Tiến tới huy hiệu ${next.badge.name}`}
              aria-valuemin={0}
              aria-valuemax={next.badge.threshold}
              aria-valuenow={next.value}
            >
              <m.span
                className="block h-full origin-left rounded-pill bg-accent"
                initial={false}
                animate={{ scaleX: Math.max(0.02, next.progress) }}
                transition={spring.soft}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Còn {next.remaining} buổi{next.badge.basis === "streak" ? " liên tiếp" : ""} nữa đến «{next.badge.name}»
            </p>
          </div>
        ) : (
          <p className="text-xs text-cleared">Đã có đủ huy hiệu. Bộ Tộc nể bạn!</p>
        )}
        {!signedIn && stats.total > 0 && <p className="text-xs text-muted">Chuỗi của khách chỉ lưu trên máy này.</p>}
      </div>
    </div>
  );
}

/**
 * The one-off celebration right after a tap that reached a badge: a burst of embers
 * (CSS, hidden under reduced motion) and the badge card popping in. Dismissable.
 */
export function BadgeCelebration({ badges, burstKey, onClose }: { badges: StreakBadgeDef[]; burstKey: number; onClose: () => void }) {
  const top = badges[badges.length - 1];
  return (
    <div aria-live="polite" className="w-full">
      <AnimatePresence>
        {top && (
          <m.div
            key={top.id}
            variants={pop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative mx-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-accent/60 bg-surface-raised px-4 py-3 text-left shadow-card"
          >
            <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <IconCleared size={30} />
              <Burst key={burstKey} count={20} distance={120} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-script text-lg font-semibold text-accent-glow">Huy hiệu mới!</p>
              <p className="font-semibold">{top.name}</p>
              <p className="text-xs text-muted">{top.hint}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <IconClose size={18} />
              <span className="sr-only">Đóng thông báo huy hiệu</span>
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
