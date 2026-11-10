"use client";

import { useId } from "react";
import { cn } from "@/shared/ui/cn";
import { QUOTE_MAX, quoteLength } from "../lib/limits";
import { formatClock, resolveMoment } from "../lib/moment";
import type { QuoteVideoOption } from "../types";

export interface QuoteDraft {
  videoId: string;
  link: string;
  time: string;
  body: string;
}

export const EMPTY_DRAFT: QuoteDraft = { videoId: "", link: "", time: "", body: "" };

const field = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2";

/** Lookup of a video's upper timestamp bound from the picker options. */
export function maxSecondsFrom(videos: QuoteVideoOption[]) {
  const byId = new Map(videos.map((v) => [v.videoId, v.durationSeconds]));
  return (id: string) => byId.get(id);
}

/** Controlled fields (kept in state so React 19 does not clear them after a failed action), with a live preview of the parsed moment. */
export function QuoteFields({ videos, draft, onChange }: { videos: QuoteVideoOption[]; draft: QuoteDraft; onChange: (d: QuoteDraft) => void }) {
  const ids = { counter: useId(), link: useId(), preview: useId() };
  const set = (k: keyof QuoteDraft) => (e: { target: { value: string } }) => onChange({ ...draft, [k]: e.target.value });
  const length = quoteLength(draft.body);
  const touched = Boolean(draft.link.trim() || draft.time.trim());
  const moment = resolveMoment(draft, maxSecondsFrom(videos));
  const title = moment.ok ? (videos.find((v) => v.videoId === moment.videoId)?.title ?? `Video ${moment.videoId}`) : null;

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Video
        <select name="videoId" value={draft.videoId} onChange={set("videoId")} disabled={Boolean(draft.link.trim())} className={field}>
          <option value="">— Chọn video gần đây —</option>
          {videos.map((v) => (
            <option key={v.videoId} value={v.videoId}>
              {v.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Hoặc dán link YouTube
        <input
          name="link"
          inputMode="url"
          autoComplete="off"
          value={draft.link}
          onChange={set("link")}
          aria-describedby={ids.link}
          placeholder="https://youtu.be/…?t=1h2m3s"
          className={field}
        />
        <span id={ids.link} className="mt-1 block text-xs text-muted">
          Trên YouTube bấm Chia sẻ, tích “Bắt đầu tại” rồi sao chép link: mốc thời gian đi kèm luôn.
        </span>
      </label>
      <label className="block text-sm">
        Mốc thời gian
        <input
          name="time"
          value={draft.time}
          onChange={set("time")}
          autoComplete="off"
          aria-describedby={ids.preview}
          placeholder="VD 12:34 hoặc 1:02:03"
          className={field}
        />
      </label>
      <p id={ids.preview} className={cn("text-xs", moment.ok ? "text-cleared" : "text-muted")}>
        {moment.ok ? `Mốc: ${formatClock(moment.atSeconds)} · ${title}` : touched ? moment.message : "Chọn video và mốc thời gian, hoặc dán link có ?t=."}
      </p>
      <label className="block text-sm">
        Câu nói (chép đúng nguyên văn)
        <textarea name="body" value={draft.body} onChange={set("body")} required rows={3} aria-describedby={ids.counter} className={field} />
        <span id={ids.counter} className={cn("mt-1 block text-right font-mono text-xs", length > QUOTE_MAX ? "text-live-text" : "text-muted")}>
          {length}/{QUOTE_MAX}
        </span>
      </label>
    </div>
  );
}

/** True when the draft can be sent (same checks the server runs, minus moderation). */
export function draftReady(draft: QuoteDraft, videos: QuoteVideoOption[], min: number): boolean {
  const length = quoteLength(draft.body);
  return length >= min && length <= QUOTE_MAX && resolveMoment(draft, maxSecondsFrom(videos)).ok;
}
