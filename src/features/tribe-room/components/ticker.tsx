"use client";

import { animate, spring, useReducedMotion } from "@/shared/motion";
import { useEffect, useRef, useState } from "react";

/** Whole number that springs from its previous value to `value`; reduced motion jumps. */
export function Ticker({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce) {
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, { ...spring.soft, onUpdate: (n) => setShown(n) });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{Math.max(0, Math.round(reduce ? value : shown)).toLocaleString("vi-VN")}</span>;
}
