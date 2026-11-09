"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

// Snapshots are whole units, so a component only re-renders when its unit rolls
// over: a "minute" clock re-renders once a minute even though the timer ticks every
// second (cheap on low-end phones; Lighthouse mobile counted ~10 per-second renders).
const seconds = () => Math.floor(Date.now() / 1000);
const minutes = () => Math.floor(Date.now() / 60_000);
// Null on the server: times depend on the viewer's clock and time zone.
const onServer = () => null;

/**
 * Current time; null during SSR and hydration. Use "minute" unless the UI shows
 * seconds (countdowns, "đã live 00:31:06").
 */
export function useNow(unit: "second" | "minute" = "second"): Date | null {
  const value = useSyncExternalStore(subscribe, unit === "second" ? seconds : minutes, onServer);
  return value === null ? null : new Date(value * (unit === "second" ? 1000 : 60_000));
}
