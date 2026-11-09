"use client";

import Link from "next/link";
import { useState } from "react";
import { soundcloudEmbedUrl } from "../lib/song-url";
import { fanSongs } from "../mock";

const BGM_TRACKS = fanSongs
  .map((s) => ({ ...s, embedUrl: soundcloudEmbedUrl(s.url, true) }))
  .filter((s): s is typeof s & { embedUrl: string } => s.embedUrl !== null);

/**
 * Floating background music player (bottom-left) for fan-made songs about anh Độ Mixi.
 * Muted/off on initial load (no auto-play without user click).
 */
export function BgMusicPlayer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);

  if (BGM_TRACKS.length === 0) return null;
  const current = BGM_TRACKS[trackIdx % BGM_TRACKS.length];

  function toggleOpen() {
    if (!open && !active) setActive(true);
    setOpen((o) => !o);
  }

  function nextTrack() {
    setActive(true);
    setTrackIdx((i) => (i + 1) % BGM_TRACKS.length);
  }

  return (
    <div className="td-dock fixed left-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 lg:bottom-4">
      {open && (
        <div className="mb-2 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface-raised/95 p-3 shadow-card backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider text-accent uppercase">Đài phát thanh Bộ Tộc</p>
              <p className="truncate text-xs font-semibold">{current.title}</p>
              <p className="truncate text-[11px] text-muted">{current.artist}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={nextTrack}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold hover:border-accent"
                title="Đổi bài nhạc nền"
              >
                Đổi bài ⏭
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted hover:text-foreground"
                title="Thu gọn (nhạc vẫn phát)"
              >
                Thu gọn
              </button>
            </div>
          </div>

          {active && (
            <div className="overflow-hidden rounded-lg border border-border/80 bg-background">
              <iframe
                key={current.id}
                title={`Nhạc nền: ${current.title}`}
                src={current.embedUrl}
                width="100%"
                height="110"
                allow="autoplay"
                className="block w-full border-0"
              />
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <Link href="/nhac" className="text-accent hover:underline" onClick={() => setOpen(false)}>
              Vào Góc nhạc nghe thêm →
            </Link>
            {active && (
              <button
                type="button"
                onClick={() => {
                  setActive(false);
                  setOpen(false);
                }}
                className="text-live-text hover:underline"
              >
                Tắt hẳn nhạc
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label={active ? "Đang bật nhạc Bộ Tộc" : "Bật nhạc nền Bộ Tộc"}
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill border border-border bg-surface-raised/95 p-2.5 text-xs font-semibold shadow-card backdrop-blur transition-colors hover:border-accent lg:px-3.5 lg:py-2"
      >
        <span
          aria-hidden
          className={`flex size-5 items-center justify-center rounded-pill text-xs ${active ? "bg-accent text-background" : "bg-accent/15 text-accent"}`}
        >
          ♪
        </span>
        {/* Below lg the live dock shares the bottom edge: show the note icon only. */}
        <span aria-hidden className="hidden lg:inline">
          {active ? "Đang bật nhạc Bộ Tộc" : "Bật nhạc nền Bộ Tộc"}
        </span>
      </button>
    </div>
  );
}
