"use client";

import Image from "next/image";
import { youtubeUrl } from "@/lib/links";
import { formatViews } from "@/lib/format";
import { nextSlot } from "@/lib/schedule";
import type { LiveStatus, ScheduleSlot } from "@/lib/types";
import { useLiveStatus } from "@/lib/use-live-status";
import { useNow } from "@/lib/use-now";

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const hms = [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
  return d ? `${d} ngày ${hms}` : hms;
}

export function LiveBanner({ status: initial, schedule }: { status: LiveStatus; schedule: ScheduleSlot[] }) {
  const now = useNow();
  const status = useLiveStatus(initial);

  if (status.state === "live" && status.videoId) {
    return (
      <a
        href={youtubeUrl(status.videoId)}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col gap-4 rounded-2xl border border-live/40 bg-surface p-5 sm:flex-row sm:items-center"
      >
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 sm:w-64">
          {status.thumbnailUrl && <Image src={status.thumbnailUrl} alt="" fill sizes="(min-width: 640px) 16rem, 100vw" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-live px-2.5 py-0.5 text-xs font-semibold text-white">
            <span className="size-2 animate-pulse rounded-full bg-white" /> ĐANG LIVE
          </span>
          <h2 className="mt-2 text-xl font-semibold group-hover:underline">{status.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {formatViews(status.concurrentViewers ?? 0)} người đang xem
            {now && status.startTime && now.getTime() > Date.parse(status.startTime) && ` · đã live ${countdown(now.getTime() - Date.parse(status.startTime))}`}
          </p>
          <p className="mt-3 text-sm font-medium text-accent">Xem trên YouTube ↗</p>
        </div>
      </a>
    );
  }

  if (status.state === "upcoming" && status.videoId && status.startTime) {
    const at = Date.parse(status.startTime);
    return (
      <a
        href={youtubeUrl(status.videoId)}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-accent/40 bg-surface p-5"
      >
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">SẮP LIVE</span>
        <h2 className="mt-2 text-xl font-semibold group-hover:underline">{status.title}</h2>
        {now && (
          <>
            <p className="mt-1 text-sm text-muted">
              {new Date(at).toLocaleString("vi-VN", { weekday: "long", hour: "2-digit", minute: "2-digit" })} (giờ của bạn)
            </p>
            <p className="mt-3 font-mono text-3xl font-bold tabular-nums">{countdown(at - now.getTime())}</p>
          </>
        )}
        <p className="mt-3 text-sm font-medium text-accent">Bấm nhắc lịch trên YouTube ↗</p>
      </a>
    );
  }

  const next = now ? nextSlot(schedule, now) : null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">Độ đang offline. Buổi stream kế tiếp:</p>
      {next && now ? (
        <>
          <h2 className="mt-1 text-xl font-semibold">{next.slot.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {next.at.toLocaleString("vi-VN", { weekday: "long", hour: "2-digit", minute: "2-digit" })} (giờ của bạn)
          </p>
          <p className="mt-3 font-mono text-3xl font-bold tabular-nums">{countdown(next.at.getTime() - now.getTime())}</p>
        </>
      ) : (
        <p className="mt-1 h-20" />
      )}
    </div>
  );
}
