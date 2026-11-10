"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { refreshDelay, STALE_ON_RETURN_MS } from "../lib/refresh";
import type { LiveStatus } from "../types";

// One store per tab, shared by every component that shows the live state (hero, dock,
// intro). No Realtime connection (ADR-019): the page arrives with the state and the time
// of the server's next check; the tab re-reads the CDN-cached /api/live only then, and only
// while it is visible (a hidden tab reads once when it comes back).
let latest: LiveStatus | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let dueWhileHidden = false;
/** Reads in a row that brought back a plan already in the past (server late or failing). */
let misses = 0;
let lastRead = 0;
let started = false;
const listeners = new Set<() => void>();

function publish(next: LiveStatus) {
  latest = next;
  listeners.forEach((notify) => notify());
}

function schedule(nextCheckAt: string | undefined) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(read, refreshDelay(nextCheckAt, Date.now(), Math.random(), misses));
}

const isPast = (iso: string | undefined) => Boolean(iso) && Date.parse(iso!) <= Date.now();

async function read() {
  timer = undefined;
  if (document.visibilityState === "hidden") {
    dueWhileHidden = true;
    return;
  }
  lastRead = Date.now();
  try {
    const res = await fetch("/api/live", { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()) as LiveStatus;
      misses = isPast(next.nextCheckAt) ? misses + 1 : 0;
      publish(next);
      schedule(next.nextCheckAt);
      return;
    }
  } catch {
    // Offline or the CDN hiccuped: handled as a miss below.
  }
  // Failed read: back off like a past plan (an epoch date is always past).
  misses++;
  schedule(new Date(0).toISOString());
}

function onVisibility() {
  if (document.visibilityState !== "visible") return;
  // Due while hidden, or back after a long time away: one read now, then the usual plan.
  if (dueWhileHidden || (lastRead && Date.now() - lastRead > STALE_ON_RETURN_MS)) {
    dueWhileHidden = false;
    if (timer) clearTimeout(timer);
    void read();
  }
}

/** True when `a` is a later reading than `b` (state changed later, or same state with a later plan). */
function newer(a: LiveStatus, b: LiveStatus): boolean {
  const ca = Date.parse(a.checkedAt);
  const cb = Date.parse(b.checkedAt);
  if (ca !== cb) return ca > cb;
  return Date.parse(a.nextCheckAt ?? "") > Date.parse(b.nextCheckAt ?? "");
}

function start(initial: LiveStatus) {
  if (!isSupabaseConfigured) return;
  if (!started) {
    started = true;
    document.addEventListener("visibilitychange", onVisibility);
    lastRead = Date.now(); // the page itself is a fresh enough reading
    schedule(initial.nextCheckAt);
    return;
  }
  // A later page (client navigation) may bring a newer reading than the one this tab fetched.
  if (latest && newer(initial, latest)) {
    publish(initial);
    schedule(initial.nextCheckAt);
  }
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

const getSnapshot = () => latest;
const getServerSnapshot = () => null;

/** Server-rendered status, then re-read from /api/live when the server's next check is due. */
export function useLiveStatus(initial: LiveStatus): LiveStatus {
  useEffect(() => start(initial), [initial]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) ?? initial;
}
