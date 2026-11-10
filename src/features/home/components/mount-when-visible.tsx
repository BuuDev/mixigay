"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mounts `children` only once the placeholder scrolls near the viewport, then keeps them.
 * Used for the realtime room: every mounted room is one Realtime connection, and the free
 * plan caps concurrent connections, so visitors who never scroll to it don't take one.
 */
export function MountWhenVisible({ children, minHeight, className }: { children: ReactNode; minHeight: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setShown(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);
  return (
    <div ref={ref} className={className} style={shown ? undefined : { minHeight }}>
      {shown ? children : null}
    </div>
  );
}
