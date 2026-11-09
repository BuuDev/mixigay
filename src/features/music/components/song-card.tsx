"use client";

import { useState, type ReactNode } from "react";
import { ReportButton } from "@/features/reports/components/report-button";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { PLATFORM_LABEL, soundcloudEmbedUrl, type SongPlatform } from "../lib/song-url";
import type { FanSong } from "../types";

const TONE: Record<SongPlatform, BadgeTone> = {
  youtube: "danger",
  soundcloud: "accent",
  tiktok: "viewer",
  spotify: "cleared",
  zingmp3: "misc",
  nhaccuatui: "steam",
};

/**
 * Fan song card: SoundCloud tracks can be played inline via SoundCloud's official widget
 * on click; all platforms also open directly on the original platform.
 */
export function SongCard({ song, vote, live = false }: { song: FanSong; vote?: ReactNode; live?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const embedSrc = song.platform === "soundcloud" ? soundcloudEmbedUrl(song.url, true) : null;

  return (
    <div className="space-y-1.5">
      <div className="rounded-lg border border-border bg-surface p-4 shadow-card transition-colors hover:border-accent/60">
        <div className="flex flex-wrap items-center gap-3">
          {vote}
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-xl text-accent">
            ♪
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={song.url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="line-clamp-2 block font-semibold hover:text-accent hover:underline"
            >
              {song.title}
              <span className="sr-only"> (mở tab mới)</span>
            </a>
            <span className="block text-xs text-muted">{song.artist}</span>
            {song.note && <span className="mt-1 line-clamp-2 block text-xs text-muted">{song.note}</span>}
          </div>
          <div className="flex items-center gap-2">
            {embedSrc && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="rounded-pill border border-accent/50 bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
              >
                {playing ? "Ẩn trình phát" : "▶ Nghe trực tiếp"}
              </button>
            )}
            <Badge tone={TONE[song.platform]}>{PLATFORM_LABEL[song.platform]}</Badge>
          </div>
        </div>

        {playing && embedSrc && (
          <div className="mt-3 overflow-hidden rounded-md border border-border/80 bg-background">
            <iframe
              title={`Nghe ${song.title} trên SoundCloud`}
              src={embedSrc}
              width="100%"
              height="120"
              allow="autoplay"
              loading="lazy"
              className="block w-full border-0"
            />
          </div>
        )}
      </div>
      <p className="text-right">
        <ReportButton kind="fan_song" targetId={song.id} demo={!live} />
      </p>
    </div>
  );
}
