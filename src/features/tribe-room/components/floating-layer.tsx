"use client";

import { m } from "@/shared/motion";
import type { FloatPath } from "../lib/reactions";

export interface Floater {
  key: number;
  emoji: string;
  path: FloatPath;
  own: boolean;
}

const TIMES = [0, 0.14, 0.62, 1];

/**
 * Emojis rising along a gentle S curve with drift, rotation and fade. Transform and
 * opacity only. Decorative: hidden from assistive tech (counts are announced instead).
 */
export function FloatingLayer({ floaters, onDone }: { floaters: Floater[]; onDone: (key: number) => void }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {floaters.map(({ key, emoji, path, own }) => (
        // The wrapper centres on the start point with CSS `translate`; Motion owns `transform`.
        <span key={key} className="absolute bottom-24 -translate-x-1/2" style={{ left: `${path.x}%` }}>
          <m.span
            className="block text-3xl leading-none will-change-transform select-none sm:text-4xl"
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.5, rotate: 0 }}
            animate={{
              opacity: [0, 1, own ? 1 : 0.9, 0],
              y: [0, -36, -120, -190],
              x: [0, Math.round(path.driftMid / 2), path.driftMid, path.driftEnd],
              scale: [0.5, path.scale, path.scale, path.scale * 0.85],
              rotate: [0, path.rotate / 3, path.rotate, path.rotate * 1.2],
            }}
            transition={{ duration: path.duration, times: TIMES, ease: "easeOut" }}
            onAnimationComplete={() => onDone(key)}
          >
            {emoji}
          </m.span>
        </span>
      ))}
    </div>
  );
}
