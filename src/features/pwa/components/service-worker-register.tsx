"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js (offline fallback page only). Production only: in dev a
 * worker would serve stale fallbacks across hot reloads.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // updateViaCache "none": the browser always re-checks sw.js itself (next.config.ts also sends no-cache).
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // No worker means no offline page; the site works the same online.
    });
  }, []);
  return null;
}
