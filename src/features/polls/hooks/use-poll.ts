"use client";

import { useEffect, useState, useTransition } from "react";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { changePollVote, unvotePoll, votePoll } from "../actions";
import { moveVote } from "../lib/results";
import type { Poll, PollOption, PollViewer } from "../types";

type CountRow = { id?: string; poll_id?: string; votes?: number };

/** Keeps `options` in step with poll_options UPDATEs (vote counts) from Supabase Realtime. */
function useLiveCounts(pollId: string, enabled: boolean, apply: (row: CountRow) => void) {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    // Loaded when the browser is idle so the Supabase client never delays first paint.
    const connect = () =>
      import("@/shared/lib/supabase-browser").then(({ browserClient }) => {
        if (cancelled) return;
        const client = browserClient();
        const channel = client
          .channel(`poll_options:${pollId}`)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "poll_options", filter: `poll_id=eq.${pollId}` }, (payload) =>
            apply(payload.new as CountRow),
          )
          .subscribe();
        cleanup = () => void client.removeChannel(channel);
      });
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(() => void connect(), { timeout: 4000 }) : undefined;
    const timer = idle === undefined ? setTimeout(() => void connect(), 1500) : undefined;
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
      cleanup?.();
    };
    // `apply` only calls a state setter; resubscribing on every render would churn channels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId, enabled]);
}

/**
 * One poll + the viewer's choice, with optimistic voting.
 * "live": votes go through the poll actions; counts follow Realtime (absolute values,
 * so the viewer's own vote is never counted twice once it arrives).
 * "demo" (no backend): everything stays in this tab.
 * The first server props are the baseline: later refreshes may carry a stale cached
 * poll (revalidateTag "max"), so they are not merged back in.
 */
export function usePoll({ poll, viewer, mode }: { poll: Poll; viewer: PollViewer; mode: "live" | "demo" }) {
  const [options, setOptions] = useState<PollOption[]>(poll.options);
  const [mine, setMine] = useState<string | null>(viewer.optionId);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string>();
  const canWrite = mode === "demo" || viewer.signedIn;

  useLiveCounts(poll.id, mode === "live", (row) => {
    if (row.poll_id !== poll.id || typeof row.id !== "string" || typeof row.votes !== "number") return;
    const votes = Math.max(0, row.votes);
    setOptions((prev) => prev.map((o) => (o.id === row.id ? { ...o, votes } : o)));
  });

  /** Pick `optionId`, or withdraw with null. Returns true when the choice changed locally. */
  function choose(optionId: string | null): boolean {
    setNotice(undefined);
    if (!canWrite) {
      setNotice("Bấm “Vào Bộ Tộc” (góc trên bên phải) để bình chọn.");
      return false;
    }
    const before = mine;
    if (before === optionId || pending) return false;
    setMine(optionId);
    setOptions((prev) => moveVote(prev, before, optionId));
    if (mode === "demo") return true;
    startTransition(async () => {
      const res = optionId === null ? await unvotePoll(poll.id) : before ? await changePollVote(poll.id, optionId) : await votePoll(poll.id, optionId);
      if (!res.ok) {
        setMine(before);
        setOptions((prev) => moveVote(prev, optionId, before));
        setNotice(res.message);
      }
    });
    return true;
  }

  return { options, mine, pending, notice, canWrite, choose };
}
