"use client";

import { useMemo, useState } from "react";
import { UNCLASSIFIED } from "@/lib/classify";
import type { ClassifiedVideo } from "@/lib/data";
import type { Game } from "@/lib/types";
import { VideoCard } from "./video-card";

type Sort = "views" | "newest";

export function VideoBrowser({ videos, games }: { videos: ClassifiedVideo[]; games: Game[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("views");
  const bySlug = useMemo(() => new Map(games.map((g) => [g.slug, g])), [games]);

  const tabs = [
    { slug: "all", label: "Tất cả", count: videos.length },
    ...games
      .map((g) => ({ slug: g.slug, label: g.name, count: videos.filter((v) => v.gameSlug === g.slug).length }))
      .filter((t) => t.count > 0),
    { slug: UNCLASSIFIED, label: "Chưa phân loại", count: videos.filter((v) => v.gameSlug === UNCLASSIFIED).length },
  ].filter((t) => t.slug === "all" || t.count > 0);

  const shown = videos
    .filter((v) => filter === "all" || v.gameSlug === filter)
    .sort((a, b) => (sort === "views" ? b.viewCount - a.viewCount : Date.parse(b.publishedAt) - Date.parse(a.publishedAt)));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.slug}
            onClick={() => setFilter(t.slug)}
            className={`rounded-full border px-3 py-1 text-sm ${filter === t.slug ? "border-accent bg-accent text-white" : "border-border bg-surface"}`}
          >
            {t.label} <span className="opacity-70">{t.count}</span>
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="ml-auto rounded-lg border border-border bg-surface px-2 py-1 text-sm"
          aria-label="Sắp xếp"
        >
          <option value="views">Nhiều lượt xem nhất</option>
          <option value="newest">Mới nhất</option>
        </select>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((v) => (
          <VideoCard key={v.videoId} video={v} game={bySlug.get(v.gameSlug)} />
        ))}
      </div>
    </div>
  );
}
