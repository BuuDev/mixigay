"use client";

import { useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapLiveStatus } from "../lib/mapper";
import type { LiveStatusRow } from "../lib/mapper";
import type { LiveStatus } from "../types";

// One Realtime subscription per page, shared by every component that shows the live
// state (hero, dock, intro). The Supabase client (~70 KB gzip) is loaded with a dynamic
// import once the browser is idle, so it never delays first paint or LCP on phones.
let latest: LiveStatus | null = null;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started || !isSupabaseConfigured) return;
  started = true;
  const connect = () =>
    import("@/shared/lib/supabase-browser").then(({ browserClient }) => {
      browserClient()
        .channel("live_status")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_status" }, (payload) => {
          latest = mapLiveStatus(payload.new as LiveStatusRow);
          listeners.forEach((notify) => notify());
        })
        .subscribe();
    });
  if ("requestIdleCallback" in window) window.requestIdleCallback(() => void connect(), { timeout: 4000 });
  else setTimeout(() => void connect(), 1500);
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  start();
  return () => {
    listeners.delete(notify);
  };
}

const getSnapshot = () => latest;
const getServerSnapshot = () => null;

/** Server-rendered status, then kept current by Supabase Realtime on live_status. */
export function useLiveStatus(initial: LiveStatus): LiveStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) ?? initial;
}
