"use client";

import { useState, useTransition } from "react";
import { changePollVote, unvotePoll, votePoll } from "../actions";
import { moveVote } from "../lib/results";
import type { Poll, PollOption, PollViewer } from "../types";

/**
 * One poll + the viewer's choice, with optimistic voting.
 * "live": votes go through the poll actions; the counts are those of the page load plus
 * the viewer's own vote (no Realtime, ADR-019: other fans' votes show on the next visit).
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
