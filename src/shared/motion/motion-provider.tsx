"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { duration, ease } from "./tokens";

// Animation features load lazily in their own chunk, so pages that never
// animate with Motion pay nothing for it.
const loadFeatures = () => import("./features").then((m) => m.default);

/**
 * Wraps the app once (root layout). `strict` makes `motion.*` components throw:
 * use `m.*` from "@/shared/motion" so everything stays inside LazyMotion.
 * reducedMotion="user" turns transform/layout animations into instant changes
 * for people who ask for less motion; opacity fades still run.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease: ease.out }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
