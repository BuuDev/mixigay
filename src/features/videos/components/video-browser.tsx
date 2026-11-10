"use client";

import Image from "next/image";
import { useState } from "react";
import { formatDate } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { Chip } from "@/shared/ui/chip";
import { UNCLASSIFIED } from "../lib/classify";
import type { GameCover, GameCoverRecord } from "../lib/game-cover";
import type { ClassifiedVideo, Game } from "../types";
import { VideoGrid } from "./video-grid";

type Sort = "views" | "newest";

/** `covers`: stream thumbnail per game slug (gameCoverRecord), shown as a banner when one game is selected. */
export function VideoBrowser({ videos, games, covers }: { videos: ClassifiedVideo[]; games: Game[]; covers?: GameCoverRecord }) {
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("views");

  const count = (slug: string) => videos.filter((v) => v.gameSlug === slug).length;
  const tabs = [
    { slug: "all", label: "Tất cả", count: videos.length },
    ...games.map((g) => ({ slug: g.slug, label: g.name, count: count(g.slug) })),
    { slug: UNCLASSIFIED, label: "Chưa phân loại", count: count(UNCLASSIFIED) },
  ].filter((t) => t.slug === "all" || t.count > 0);

  const shown = videos
    .filter((v) => filter === "all" || v.gameSlug === filter)
    .sort((a, b) => (sort === "views" ? b.viewCount - a.viewCount : Date.parse(b.publishedAt) - Date.parse(a.publishedAt)));

  const selectedGame = games.find((g) => g.slug === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Chip key={t.slug} active={filter === t.slug} onClick={() => setFilter(t.slug)}>
            {t.label} <span className="font-normal">{t.count}</span>
          </Chip>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="ml-auto rounded-md border border-border bg-surface px-2 py-1 text-sm"
          aria-label="Sắp xếp"
        >
          <option value="views">Nhiều lượt xem nhất</option>
          <option value="newest">Mới nhất</option>
        </select>
      </div>
      {selectedGame && covers?.[selectedGame.slug] && <GameBanner name={selectedGame.name} count={shown.length} cover={covers[selectedGame.slug]} />}
      <h2 className="sr-only">Danh sách video</h2>
      <div className="mt-4">
        <VideoGrid videos={shown} games={games} animationKey={`${filter}-${sort}`} />
      </div>
    </div>
  );
}

/** Subtle header for the selected game: its stream thumbnail behind a dark scrim, so the white text stays above 4.5:1. */
function GameBanner({ name, count, cover }: { name: string; count: number; cover: GameCover }) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-lg border border-border bg-surface-raised">
      <Image src={cover.thumbnailUrl} alt="" fill sizes="(min-width: 1152px) 72rem, 100vw" className="object-cover" />
      <div className="relative bg-gradient-to-r from-black/90 via-black/75 to-black/40 px-4 py-5 text-white">
        <p className="text-lg font-bold">{name}</p>
        <p className="text-sm">{count} video</p>
        <a
          href={youtubeUrl(cover.videoId)}
          target="_blank"
          rel="noopener noreferrer"
          title={cover.title}
          className="mt-1 inline-block text-xs underline underline-offset-2"
        >
          {cover.wasLive ? "Ảnh từ buổi stream" : "Ảnh từ video"} {formatDate(cover.publishedAt)}
        </a>
      </div>
    </div>
  );
}
