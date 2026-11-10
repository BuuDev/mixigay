import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/shared/lib/format";
import { OFFICIAL_CHANNEL_URL, youtubeUrl } from "@/shared/lib/links";
import { chipClass } from "@/shared/ui/chip";
import type { GameCover } from "../lib/game-cover";
import { PAGE, MAX_LIMIT, videoHref, type VideoQuery, type VideoTab } from "../lib/video-query";
import type { ClassifiedVideo, Game } from "../types";
import { VideoGrid } from "./video-grid";

const SORTS: { value: VideoQuery["sort"]; label: string }[] = [
  { value: "views", label: "Nhiều lượt xem nhất" },
  { value: "newest", label: "Mới nhất" },
];

/**
 * Server-rendered filter bar + one page of cards. Filters are plain links (?game=&sort=&n=),
 * so they work without JavaScript and only the visible cards are sent to the browser.
 */
export function VideoBrowser({
  query,
  tabs,
  items,
  total,
  cover,
  games,
}: {
  query: VideoQuery;
  tabs: VideoTab[];
  items: ClassifiedVideo[];
  total: number;
  cover: GameCover | null;
  games: Game[];
}) {
  const selected = tabs.find((t) => t.slug === query.game);
  const canMore = items.length < total && query.limit < MAX_LIMIT;
  return (
    <div>
      <nav aria-label="Lọc video theo game" className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Link
            key={t.slug}
            href={videoHref({ ...query, game: t.slug, limit: PAGE })}
            scroll={false}
            aria-current={query.game === t.slug ? "page" : undefined}
            className={chipClass(query.game === t.slug)}
          >
            {t.label} <span className="font-normal">{t.count}</span>
          </Link>
        ))}
        <span className="ml-auto flex gap-1" role="group" aria-label="Sắp xếp">
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={videoHref({ ...query, sort: s.value, limit: PAGE })}
              scroll={false}
              aria-current={query.sort === s.value ? "true" : undefined}
              className={chipClass(query.sort === s.value, "text-xs")}
            >
              {s.label}
            </Link>
          ))}
        </span>
      </nav>
      {selected && cover && <GameBanner name={selected.label} count={total} cover={cover} />}
      <h2 className="sr-only">Danh sách video</h2>
      <div className="mt-4">
        <VideoGrid videos={items} games={games} animationKey={`${query.game}-${query.sort}`} />
      </div>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted">
        <p>
          Đang xem {items.length} / {total} video
        </p>
        {canMore && (
          <Link
            href={videoHref({ ...query, limit: query.limit + PAGE })}
            scroll={false}
            className={chipClass(false, "px-5 py-2 font-semibold text-foreground")}
          >
            Xem thêm {Math.min(PAGE, total - items.length)} video
          </Link>
        )}
        {!canMore && items.length < total && (
          <p>
            Xem toàn bộ trên{" "}
            <a href={`${OFFICIAL_CHANNEL_URL}/videos`} target="_blank" rel="noopener noreferrer" className="text-accent underline">
              kênh YouTube
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}

/** Subtle header for the selected game: its stream thumbnail behind a dark scrim, so the white text stays above 4.5:1. */
function GameBanner({ name, count, cover }: { name: string; count: number; cover: GameCover }) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-lg border border-border bg-surface-raised">
      <Image src={cover.thumbnailUrl} alt="" fill sizes="(min-width: 1536px) 88rem, (min-width: 1280px) 80rem, 100vw" className="object-cover" />
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
