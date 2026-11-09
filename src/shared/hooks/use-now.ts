"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

// Snapshot is whole seconds so it stays stable between ticks.
const getSnapshot = () => Math.floor(Date.now() / 1000);
// Null on the server: times depend on the viewer's clock and time zone.
const getServerSnapshot = () => null;

/** Current time, ticking every second; null during SSR and hydration. */
export function useNow(): Date | null {
  const seconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return seconds === null ? null : new Date(seconds * 1000);
}
