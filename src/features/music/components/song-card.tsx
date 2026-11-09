import Link from "next/link";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { PLATFORM_LABEL, type SongPlatform } from "../lib/song-url";
import type { FanSong } from "../types";

const TONE: Record<SongPlatform, BadgeTone> = { youtube: "danger", soundcloud: "accent", tiktok: "viewer", spotify: "cleared", zingmp3: "misc", nhaccuatui: "steam" };

/** Fan song: a link out to where the fan published it (never embedded), plus a report link. */
export function SongCard({ song }: { song: FanSong }) {
  return (
    <div className="space-y-1">
      <a
        href={song.url}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-card transition-colors hover:border-accent"
      >
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-xl motion-safe:group-hover:animate-td-flicker">
          ♪
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block font-semibold group-hover:underline">{song.title}</span>
          <span className="block text-xs text-muted">{song.artist}</span>
          {song.note && <span className="mt-1 line-clamp-2 block text-xs text-muted">{song.note}</span>}
        </span>
        <Badge tone={TONE[song.platform]}>{PLATFORM_LABEL[song.platform]}</Badge>
        <span className="sr-only">(mở tab mới)</span>
      </a>
      <p className="text-right">
        <Link href="/gioi-thieu#lien-he" className="text-xs text-muted hover:text-foreground hover:underline">
          Báo bài này
        </Link>
      </p>
    </div>
  );
}
