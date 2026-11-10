"use client";

import { m, spring, useReducedMotion } from "@/shared/motion";
import { CountUp } from "@/shared/motion/count-up";
import { cn } from "@/shared/ui/cn";

const number = new Intl.NumberFormat("vi-VN");

/**
 * One option: a pressable row whose background is the result bar. The bar animates
 * `scaleX` (transform only) with a spring; the leader gets a soft ember glow layer
 * (opacity only). Reduced motion: both jump to their final state.
 */
export function PollOptionRow({
  label,
  votes,
  percent,
  showResults,
  selected,
  leader,
  interactive,
  onChoose,
}: {
  label: string;
  votes: number;
  percent: number;
  showResults: boolean;
  selected: boolean;
  leader: boolean;
  /** False for read-only rows (guests, closed polls): rendered as text, not a button. */
  interactive: boolean;
  onChoose?: () => void;
}) {
  const reduce = useReducedMotion();
  const instant = { duration: 0 };

  const body = (
    <>
      <m.span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-full origin-left rounded-[inherit]", leader ? "bg-accent/25" : "bg-surface-raised")}
        initial={false}
        animate={{ scaleX: showResults ? Math.max(percent, 0) / 100 : 0 }}
        transition={reduce ? instant : spring.soft}
      />
      <m.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[0_0_22px_-4px_var(--td-ember-glow)] ring-1 ring-accent/60"
        initial={false}
        animate={{ opacity: showResults && leader ? 1 : 0 }}
        transition={reduce ? instant : { duration: 0.42 }}
      />
      <span className="relative flex min-w-0 flex-1 items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors duration-150",
            selected ? "border-accent bg-accent text-background" : "border-border text-transparent",
          )}
        >
          ✓
        </span>
        <span className="min-w-0 break-words">{label}</span>
      </span>
      {showResults && (
        <span className="relative flex shrink-0 flex-col items-end leading-tight">
          <CountUp value={percent} format={(n) => `${Math.round(n)}%`} className={cn("font-bold tabular-nums", leader ? "text-accent" : "text-foreground")} />
          <span className="text-xs text-muted tabular-nums">
            <CountUp value={votes} format={(n) => number.format(Math.round(n))} /> phiếu
          </span>
        </span>
      )}
      {selected && <span className="sr-only"> (lựa chọn của bạn)</span>}
    </>
  );

  const shell = cn(
    "relative flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-md border px-3 py-2.5 text-left text-sm sm:text-base",
    selected ? "border-accent" : "border-border",
  );

  if (!interactive) return <div className={shell}>{body}</div>;
  return (
    <m.button
      type="button"
      onClick={onChoose}
      aria-pressed={selected}
      whileTap={{ scale: 0.98 }}
      className={cn(
        shell,
        "transition-colors duration-150 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      {body}
    </m.button>
  );
}
