"use client";

import { SmartImage as Image } from "@/shared/ui/smart-image";
import { useState, type ReactNode } from "react";
import { BGM_PAUSE_EVENT } from "../lib/bgm";
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
    <article className="rounded-lg border border-border bg-surface p-3 shadow-card transition-colors hover:border-accent/60 sm:p-4">
      <div className="flex items-start gap-3">
        {vote}
        <SongCover src={song.thumbnailUrl} />
        <div className="min-w-0 flex-1">
          <a
            href={song.url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="line-clamp-2 block font-semibold break-words hover:text-accent hover:underline"
          >
            {song.title}
            <span className="sr-only"> (mở tab mới)</span>
          </a>
          <span className="block truncate text-xs text-muted">{song.artist}</span>
          {song.note && <span className="mt-1 line-clamp-2 block text-xs break-words text-muted">{song.note}</span>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {embedSrc && (
          <button
            type="button"
            data-bgm-ignore
            onClick={() => {
              // Two songs at once is noise: the background radio steps aside.
              if (!playing) window.dispatchEvent(new Event(BGM_PAUSE_EVENT));
              setPlaying((p) => !p);
            }}
            className="min-h-9 rounded-pill border border-accent/50 bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-background"
          >
            {playing ? "Ẩn trình phát" : "▶ Nghe trực tiếp"}
          </button>
        )}
        <Badge tone={TONE[song.platform]}>{PLATFORM_LABEL[song.platform]}</Badge>
        {/* A <div>, never a <p>: ReportButton renders a popover <div>. */}
        <div className="ml-auto">
          <ReportButton kind="fan_song" targetId={song.id} demo={!live} />
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
    </article>
  );
}

/** Platform cover (decorative: the title already names the song); ♪ when there is none. */
function SongCover({ src }: { src?: string }) {
  if (!src) {
    return (
      <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-2xl text-accent sm:size-20">
        ♪
      </span>
    );
  }
  return (
    <span className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border/60 bg-background sm:size-20">
      <Image src={src} alt="" fill sizes="(min-width: 640px) 80px, 64px" className="object-cover" />
    </span>
  );
}
