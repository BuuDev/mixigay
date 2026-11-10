"use client";

// The only entry point to the animation library. Features import from here, never
// from "motion/react" directly (enforced by ESLint), so the library, the lazy
// feature bundle and reduced-motion handling stay in one place.
export { animate, AnimatePresence, m, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
export type { Variants } from "motion/react";
export * from "./presets";
export * from "./tokens";
