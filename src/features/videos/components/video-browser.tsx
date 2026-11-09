"use client";

import { useState } from "react";
import { Chip } from "@/shared/ui/chip";
import { UNCLASSIFIED } from "../lib/classify";
import type { ClassifiedVideo, Game } from "../types";
import { VideoGrid } from "./video-grid";

type Sort = "views" | "newest";

export function VideoBrowser({ videos, games }: { videos: ClassifiedVideo[]; games: Game[] }) {
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
      <h2 className="sr-only">Danh sách video</h2>
      <div className="mt-4">
        <VideoGrid videos={shown} games={games} animationKey={`${filter}-${sort}`} />
      </div>
    </div>
  );
}
