"use client";

import { m, spring } from "@/shared/motion";
import { cn } from "@/shared/ui/cn";
import { IconKindle } from "@/shared/ui/icons";
import { flameLevel } from "../lib/streak";

// Per level: flame scale, glow opacity. Level 0 is an unlit ember.
const SCALE = [0.7, 0.85, 1, 1.18, 1.36] as const;
const GLOW = [0, 0.25, 0.4, 0.6, 0.8] as const;

/**
 * The streak flame: grows with the run (spring on `scale`, GPU transform only) and
 * breathes with the CSS `td-flicker` loop behind `motion-safe:`, so reduced motion
 * gets a still flame at its final size (MotionConfig reducedMotion="user").
 */
export function StreakFlame({ streak, className }: { streak: number; className?: string }) {
  const level = flameLevel(streak);
  return (
    <span className={cn("relative inline-flex size-14 shrink-0 items-center justify-center", className)} aria-hidden>
      <span className="absolute inset-1 rounded-full bg-accent blur-xl transition-opacity duration-300" style={{ opacity: GLOW[level] }} />
      <m.span className="relative inline-flex origin-bottom" initial={false} animate={{ scale: SCALE[level] }} transition={spring.bouncy}>
        <span className={cn("inline-flex origin-bottom", level > 0 ? "text-accent motion-safe:animate-td-flicker" : "text-muted")}>
          <IconKindle size={40} />
        </span>
      </m.span>
    </span>
  );
}
