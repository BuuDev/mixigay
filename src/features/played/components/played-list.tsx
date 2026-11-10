import { SmartImage as Image } from "@/shared/ui/smart-image";
import type { Suggestion } from "@/features/suggestions/types";
import type { GameCover } from "@/features/videos/lib/game-cover";
import type { Game } from "@/features/videos/types";
import { formatDate } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { IconCleared, IconDropped, IconLive } from "@/shared/ui/icons";
import type { PlayedGame, PlayStatus } from "../types";

const SECTIONS: { status: PlayStatus; title: string; subtitle: string; tone: BadgeTone; icon: typeof IconLive }[] = [
  { status: "playing", title: "Đang chơi", subtitle: "Đang mở shop, săn kèn Harmonica hoặc cày cùng anh em mỗi tối", tone: "accent", icon: IconLive },
  { status: "finished", title: "Đã phá đảo", subtitle: "Đã về nước (dù đôi lúc giải đố độ khó thiếu nhi hơi lâu)", tone: "cleared", icon: IconCleared },
  { status: "dropped", title: "Đã drop", subtitle: "Đã xóa game trên sóng hoặc tạm cất vào kho kỷ niệm", tone: "muted", icon: IconDropped },
];

interface Props {
  played: PlayedGame[];
  games: Game[];
  suggestions: Suggestion[];
  /** Per game: the thumbnail of anh Độ's own stream of it (see gameCovers). Games without one keep the gradient. */
  covers?: ReadonlyMap<string, GameCover>;
}

/** "Anh Độ đã chơi", grouped by status; marks games that came from fan suggestions. */
export function PlayedList({ played, games, suggestions, covers }: Props) {
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  const fromFans = new Map(suggestions.filter((s) => s.linkedGameSlug).map((s) => [s.linkedGameSlug!, s]));

  return (
    <>
      {SECTIONS.map(({ status, title, subtitle, tone, icon: Icon }) => {
        const rows = played.filter((p) => p.status === status);
        if (!rows.length) return null;
        return (
          <section key={status}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold">
                <Icon size={18} /> {title}
              </h2>
              <p className="text-xs text-muted">{subtitle}</p>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p) => {
                const game = bySlug.get(p.gameSlug);
                const fan = fromFans.get(p.gameSlug);
                return (
                  <Card key={p.gameSlug} className="flex h-full flex-col overflow-hidden">
                    <PlayedCover cover={covers?.get(p.gameSlug)} gradient={game?.cover} />
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <h3 className="line-clamp-1 font-semibold">{game?.name ?? p.gameSlug}</h3>
                      {fan && (
                        <Badge tone={tone} className="self-start">
                          Fan đề xuất · {fan.upvotes} vote
                        </Badge>
                      )}
                      <p className="mt-auto pt-1 text-xs text-muted">
                        {p.sessions} buổi{p.lastPlayed && ` · lần cuối ${formatDate(p.lastPlayed)}`}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

/** 16:9 visual on top of a card: the stream thumbnail with a caption linking out to YouTube, or the gradient placeholder. */
function PlayedCover({ cover, gradient }: { cover?: GameCover; gradient?: string }) {
  if (!cover) return <div className={`aspect-video bg-gradient-to-br ${gradient ?? "from-zinc-600 to-zinc-800"}`} />;
  return (
    <div className="relative aspect-video bg-surface-raised">
      <Image src={cover.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw" className="object-cover" />
      {/* Dark scrim keeps the white caption above 4.5:1 on any thumbnail. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pt-6 pb-1.5">
        <a
          href={youtubeUrl(cover.videoId)}
          target="_blank"
          rel="noopener noreferrer"
          title={cover.title}
          className="line-clamp-1 text-xs text-white underline underline-offset-2"
        >
          {cover.wasLive ? "Ảnh từ buổi stream" : "Ảnh từ video"} {formatDate(cover.publishedAt)}
        </a>
      </div>
    </div>
  );
}
