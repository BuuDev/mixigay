"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "./env";
import { browserClient } from "./supabase/browser";
import { mapLiveStatus } from "./supabase/map";
import type { LiveStatusRow } from "./supabase/rows";
import type { LiveStatus } from "./types";

/** Server-rendered status, then kept current by Supabase Realtime on live_status. */
export function useLiveStatus(initial: LiveStatus): LiveStatus {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = browserClient()
      .channel("live_status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_status" }, (payload) => {
        setStatus(mapLiveStatus(payload.new as LiveStatusRow));
      })
      .subscribe();
    return () => {
      void browserClient().removeChannel(channel);
    };
  }, []);

  return status;
}
