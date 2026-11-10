// Motion tokens for Motion (motion/react) components. Mirror of the CSS variables
// in ./motion.css — change both together.

/** Seconds. */
export const duration = {
  instant: 0.12,
  fast: 0.18,
  base: 0.26,
  slow: 0.42,
  /** The intro ritual's flame — the one big moment (600–900 ms per spec). */
  ritual: 0.8,
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  spring: [0.34, 1.56, 0.64, 1],
} as const;

/** Physical springs for things that are touched (buttons, lids, sheets). */
export const spring = {
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.8 },
  soft: { type: "spring", stiffness: 260, damping: 26 },
  bouncy: { type: "spring", stiffness: 380, damping: 14 },
} as const;
