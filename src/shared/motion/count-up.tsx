"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { duration, ease } from "./tokens";

/**
 * Number that rolls from its previous value to `value` (viewer counters, stats).
 * `format` turns the in-between number into text; reduced motion jumps straight there.
 */
export function CountUp({ value, format = (n) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce) {
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: duration.slow * 2,
      ease: ease.out,
      onUpdate: (n) => setShown(n),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{format(reduce ? value : shown)}</span>;
}
