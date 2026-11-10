"use client";

import { useEffect } from "react";
import { useNow } from "@/shared/hooks/use-now";
import { setScheduledTheme } from "../lib/dom";
import { activeThemeAt } from "../lib/pick";
import type { ThemeWindow } from "../types";

/**
 * Turns the scheduled skin on by the viewer's clock (Vietnam date), and off again
 * outside its window. Renders nothing; the skin is pure CSS tokens on <html>, with
 * no transition, so there is no motion to reduce.
 */
export function ThemeApplier({ windows }: { windows: ThemeWindow[] }) {
  const now = useNow("minute"); // null during SSR/hydration: "today" is the viewer's, never the prerender's
  const ready = now !== null;
  const theme = now ? activeThemeAt(windows, now) : null;
  useEffect(() => {
    if (ready) setScheduledTheme(theme);
  }, [ready, theme]);
  return null;
}
