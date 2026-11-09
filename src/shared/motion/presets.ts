import type { Variants } from "motion/react";
import { duration, ease } from "./tokens";

// Reusable variants: features compose these instead of inventing timings.
// Each uses "hidden" / "visible" / "exit" so they work with AnimatePresence.

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.inOut } },
};

/** Content arriving from slightly below: cards, list items, status lines. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast, ease: ease.inOut } },
};

/** Popovers, badges, confirmations. */
export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.fast, ease: ease.spring } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: duration.instant } },
};

/** Bottom sheets / lightbox panels on mobile. */
export const sheet: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, y: "100%", transition: { duration: duration.base, ease: ease.inOut } },
};

/** Parent that reveals its children one after another. */
export function stagger(step = 0.05, delay = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: step, delayChildren: delay } },
    exit: { transition: { staggerChildren: step / 2, staggerDirection: -1 } },
  };
}

/** Feedback for anything pressable. */
export const press = { whileTap: { scale: 0.96 }, whileHover: { y: -1 } } as const;
