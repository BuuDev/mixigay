import type { Metadata } from "next";
import Link from "next/link";
import { getFanArt } from "@/features/fan-art/server/queries";
import { selectLatestArtForStream, selectLatestSongsForStream, selectTopGamesForStream } from "@/features/for-anh-do/lib/curate";
import { PLATFORM_LABEL } from "@/features/music/lib/song-url";
import { getFanSongs } from "@/features/music/server/queries";
import { getSuggestions } from "@/features/suggestions/server/queries";
import { WallStreamList } from "@/features/wall/components/wall-stream-list";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { Badge } from "@/shared/ui/badge";
import { Mascot, SceneArt } from "@/shared/ui/brand-art";
import { Card } from "@/shared/ui/card";
import { IconAlbum, IconEvent, IconSuggest, IconUpvote, IconWall } from "@/shared/ui/icons";
import { NeonText } from "@/shared/ui/neon-text";
import { SectionHeader } from "@/shared/ui/section-header";

export const metadata: Metadata = {
  title: "Gửi anh Độ – Góc Bộ Tộc",
  description: "Trang tổng hợp chữ to, gọn gàng để anh Độ Mixi xem nhanh trên sóng: top game Bộ Tộc đề xuất, nhạc nịnh và tranh fan art đã duyệt.",
};

// Reference timestamp used when filtering recent suggestions in cached renders.
const STREAM_REF_MS = Date.parse("2026-11-09T12:00:00Z");

export default async function ForAnhDoPage() {
  const [suggestions, songs, fanArt] = await Promise.all([getSuggestions(), getFanSongs(), getFanArt()]);
  const topGames = selectTopGamesForStream(suggestions, STREAM_REF_MS, 6);
  const topSongs = selectLatestSongsForStream(songs, 4);
  const latestArt = selectLatestArtForStream(fanArt, 6);

  return (
    <div className="space-y-16 py-6">
      <header className="mx-auto max-w-3xl text-center">
        <SceneArt scene="04-phong-chat" size={160} sizes="(min-width: 640px) 160px, 112px" className="mx-auto mb-3 size-28 sm:size-40" />
        <div>
          <Badge tone="accent">Chế độ đọc nhanh trên sóng · 100% nội dung đã kiểm duyệt</Badge>
        </div>
        <h1>
          <NeonText className="mt-3 block text-4xl text-balance sm:text-5xl">GỬI ANH ĐỘ MIXI</NeonText>
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
          Trang tổng hợp gọn, chữ to để anh Độ và team xem nhanh những tựa game anh em Bộ Tộc đang mong chờ nhất, cùng nhạc và tranh fan gửi tặng. Mọi mục trên
          trang này đều đã qua kiểm duyệt, không tự phát âm thanh và chỉ dẫn tới các nền tảng chính thức.
        </p>
      </header>

      <ScrollReveal as="section">
        <SectionHeader
          eyebrow="Bộ Tộc bình chọn nhiều nhất"
          title="Top Game Bộ Tộc đề xuất tuần này"
          icon={<IconSuggest size={28} className="text-accent" />}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {topGames.map((g, idx) => (
            <Card key={g.id} className="flex flex-col justify-between border-2 border-border p-5 transition-colors hover:border-accent">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-pill bg-accent font-mono text-sm font-black text-background">
                      #{idx + 1}
                    </span>
                    <Badge tone="steam">{g.sourceLabel}</Badge>
                    {g.price && <span className="font-mono text-xs text-muted">{g.price}</span>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent/15 px-3 py-1 font-mono text-sm font-bold text-accent">
                    <IconUpvote size={16} />
                    {g.upvotes} phiếu
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-black tracking-tight text-foreground sm:text-2xl">{g.name}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">“{g.reason}”</p>
                {g.genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.genres.map((genre) => (
                      <span key={genre} className="rounded bg-background px-2 py-0.5 text-xs text-muted">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-xs text-muted">Đã duyệt nội dung</span>
                {g.safeUrl ? (
                  <a href={g.safeUrl} target="_blank" rel="noopener noreferrer nofollow ugc" className="font-bold text-accent hover:underline">
                    Mở trang game ↗
                  </a>
                ) : (
                  <span className="text-xs text-muted">Không đính kèm link</span>
                )}
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Xem toàn bộ danh sách và bộ lọc theo thể loại tại trang{" "}
          <Link href="/de-xuat" className="font-semibold text-accent underline underline-offset-2">
            Đề xuất game
          </Link>
          .
        </p>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader
          eyebrow="Fan sáng tác · Không tự phát nhạc"
          title="Nhạc nịnh & Tranh vẽ mới nhất đã duyệt"
          icon={<IconEvent size={28} className="text-accent" />}
        />
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            {topSongs.map((s) => (
              <Card key={s.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">{PLATFORM_LABEL[s.platform]}</Badge>
                    <span className="font-mono text-xs text-muted">▲ {s.upvotes}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-extrabold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted">Tác giả: {s.artist}</p>
                  {s.note && <p className="mt-1 text-sm text-muted">“{s.note}”</p>}
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="shrink-0 rounded-pill border border-accent bg-accent/15 px-4 py-2 text-sm font-bold text-accent hover:bg-accent hover:text-background"
                >
                  Mở bài ↗
                </a>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <IconAlbum size={22} className="text-accent" />
              Tranh Fan Art mới duyệt
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestArt.map((art) => (
                <Card key={art.id} className="overflow-hidden border border-border bg-surface">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.imageUrl} alt={art.title} loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h4 className="text-base font-bold text-foreground">{art.title}</h4>
                    <p className="mt-0.5 text-sm font-medium text-accent">Bút danh: {art.artist}</p>
                    {art.note && <p className="mt-1 text-sm text-muted">{art.note}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Lời chúc từ cộng đồng" title="Lời nhắn gửi anh Độ từ Bức tường Bộ Tộc" icon={<IconWall size={28} className="text-accent" />} />
        <div className="mb-6">
          <WallStreamList limit={6} />
        </div>
        <Card className="flex flex-wrap items-center gap-5 p-6">
          <Mascot pose="hello" size={72} decorative className="shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-lg font-extrabold">Chúc anh Độ thật nhiều sức khỏe và những buổi lên sóng rực rỡ lúc 22:22!</h3>
            <p className="text-sm leading-relaxed text-muted">
              Lời nhắn trên{" "}
              <Link href="/bo-toc" className="font-semibold text-accent underline underline-offset-2">
                Bức tường Bộ Tộc
              </Link>{" "}
              tối đa 140 ký tự và được kiểm duyệt 100% trước khi hiển thị. Nếu anh Độ hoặc team quản lý cần điều chỉnh hay gỡ bất kỳ nội dung nào trên trang,
              xin xem hướng dẫn tại mục{" "}
              <Link href="/gioi-thieu#lien-he" className="font-semibold text-accent underline underline-offset-2">
                Liên hệ & Gỡ nội dung
              </Link>
              .
            </p>
          </div>
        </Card>
      </ScrollReveal>
    </div>
  );
}
