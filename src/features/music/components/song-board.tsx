"use client";

import { useOptimistic, useState, useTransition } from "react";
import { VoteButton } from "@/features/suggestions/components/vote-button";
import { toggleSongVote } from "../actions";
import type { FanSong } from "../types";
import { SongCard } from "./song-card";

type Vote = { id: string; on: boolean };

/** Fan songs with optimistic upvotes; most-voted first, newest breaks ties. */
export function SongBoard({ songs, votedIds, signedIn, live }: { songs: FanSong[]; votedIds: string[]; signedIn: boolean; live: boolean }) {
  const [state, apply] = useOptimistic({ songs, voted: new Set(votedIds) }, (s, { id, on }: Vote) => {
    const voted = new Set(s.voted);
    if (on) voted.add(id);
    else voted.delete(id);
    return { voted, songs: s.songs.map((x) => (x.id === id ? { ...x, upvotes: x.upvotes + (on ? 1 : -1) } : x)) };
  });
  const [, start] = useTransition();
  const [notice, setNotice] = useState<string>();

  function vote(id: string) {
    if (!live) return setNotice("Chế độ demo: chưa nối Supabase nên chưa upvote được.");
    if (!signedIn) return setNotice("Bấm “Vào Bộ Tộc” (góc trên bên phải) để upvote.");
    const on = !state.voted.has(id);
    start(async () => {
      apply({ id, on });
      const res = await toggleSongVote(id);
      if (!res.ok) setNotice(res.message ?? "Có lỗi, thử lại sau.");
    });
  }

  const sorted = [...state.songs].sort((a, b) => b.upvotes - a.upvotes || Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return (
    <div className="space-y-3">
      {notice && (
        <p role="status" className="rounded-md bg-accent/10 px-3 py-2 text-sm">
          {notice}
        </p>
      )}
      {sorted.map((s) => (
        <SongCard
          key={s.id}
          song={s}
          live={live}
          vote={<VoteButton name={s.title} count={s.upvotes} voted={state.voted.has(s.id)} onVote={() => vote(s.id)} />}
        />
      ))}
    </div>
  );
}
