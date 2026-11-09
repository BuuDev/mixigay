"use client";

import { useEffect } from "react";

/**
 * Marks <html data-overlay> while a full-screen overlay (intro, sheet) is open, so
 * CSS can hide floating UI such as the live dock (motion.css, `.td-dock`).
 */
export function useOverlayFlag(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const count = Number(root.dataset.overlay ?? 0) + 1;
    root.dataset.overlay = String(count);
    return () => {
      const left = Number(root.dataset.overlay ?? 1) - 1;
      if (left > 0) root.dataset.overlay = String(left);
      else delete root.dataset.overlay;
    };
  }, [open]);
}
