"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleVote } from "../actions";
import type { Suggestion } from "../types";

type VoteAction = { id: string; voted: boolean };

function applyVote(items: Suggestion[], voted: Set<string>, { id, voted: on }: VoteAction) {
  const next = new Set(voted);
  if (on) next.add(id);
  else next.delete(id);
  return { voted: next, items: items.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + (on ? 1 : -1) } : s)) };
}

/**
 * Suggestions + the viewer's votes, with optimistic voting.
 * "live": server props are the truth, votes go through the toggleVote action.
 * "demo" (no backend): everything stays in this browser tab.
 */
export function useSuggestionVotes({ initial, votedIds, mode, signedIn }: { initial: Suggestion[]; votedIds: string[]; mode: "live" | "demo"; signedIn: boolean }) {
  const [demo, setDemo] = useState({ items: initial, voted: new Set<string>() });
  const base = mode === "demo" ? demo : { items: initial, voted: new Set(votedIds) };
  const [optimistic, addOptimistic] = useOptimistic(base, (state, action: VoteAction) => applyVote(state.items, state.voted, action));
  const [, startTransition] = useTransition();
  const [notice, setNotice] = useState<string>();

  function vote(id: string) {
    const action = { id, voted: !optimistic.voted.has(id) };
    if (mode === "demo") {
      setDemo((d) => applyVote(d.items, d.voted, action));
      return;
    }
    if (!signedIn) {
      setNotice("Đăng nhập Google (góc trên bên phải) để upvote.");
      return;
    }
    startTransition(async () => {
      addOptimistic(action);
      const res = await toggleVote(id);
      if (!res.ok) setNotice(res.message ?? "Có lỗi, thử lại sau.");
    });
  }

  const addDemo = (s: Suggestion) => setDemo((d) => ({ ...d, items: [s, ...d.items] }));

  return { items: optimistic.items, voted: optimistic.voted, vote, notice, addDemo, demoItems: demo.items };
}
