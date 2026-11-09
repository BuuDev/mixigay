import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/server/viewer";
import { SongBoard } from "@/features/music/components/song-board";
import { SongForm } from "@/features/music/components/song-form";
import { getFanSongs, getMySongVoteIds } from "@/features/music/server/queries";
import { EpisodeList } from "@/features/series/components/episode-list";
import { getSeriesBySlug } from "@/features/series/server/queries";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { IconEvent } from "@/shared/ui/icons";
import { NeonText } from "@/shared/ui/neon-text";
import { SectionHeader } from "@/shared/ui/section-header";

export const metadata: Metadata = { title: "Góc nhạc – Góc Bộ Tộc" };

export default async function MusicPage() {
  const [anLieng, songs] = await Promise.all([getSeriesBySlug("phong-tra-an-lieng"), getFanSongs()]);
  return (
    <div className="space-y-16 py-6">
      <header className="text-center">
        <NeonText className="text-4xl sm:text-5xl">GÓC NHẠC</NeonText>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Phòng Trà An Liễng trên kênh và những bài “nhạc nịnh” Bộ Tộc tự làm. Bài trên SoundCloud có thể bấm nghe trực tiếp tại chỗ hoặc mở ở nền tảng gốc.
        </p>
      </header>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Đêm nhạc trên kênh" title="Phòng Trà An Liễng" icon={<IconEvent size={26} className="text-accent" />} />
        {anLieng ? <EpisodeList series={anLieng} /> : <EmptyState art="empty-videos" title="Chưa có tập An Liễng nào trong dữ liệu" />}
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Fan làm" title="Nhạc nịnh Bộ Tộc" icon={<IconEvent size={26} className="text-accent" />} />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
            {songs.length ? (
              <Suspense fallback={<SongBoard songs={songs} votedIds={[]} signedIn={false} live={isSupabaseConfigured} />}>
                <SongList songs={songs} />
              </Suspense>
            ) : (
              <EmptyState art="empty-suggestions" title="Chưa có bài nào được duyệt" />
            )}
          </div>
          <Suspense fallback={null}>
            <SubmitBox />
          </Suspense>
        </div>
      </ScrollReveal>
    </div>
  );
}

/** Dynamic part: the visitor's own votes. */
async function SongList({ songs }: { songs: Awaited<ReturnType<typeof getFanSongs>> }) {
  const viewer = isSupabaseConfigured ? await getViewer() : null;
  const votedIds = viewer ? await getMySongVoteIds(viewer.id) : [];
  return <SongBoard songs={songs} votedIds={votedIds} signedIn={Boolean(viewer)} live={isSupabaseConfigured} />;
}

/** Dynamic part: whether the visitor can submit. */
async function SubmitBox() {
  if (!isSupabaseConfigured) {
    return (
      <Card className="p-4 text-sm">
        <p className="font-bold">Gửi bài nhạc nịnh</p>
        <p className="mt-2 text-muted">Chế độ demo: chưa nối Supabase nên chưa gửi được bài.</p>
      </Card>
    );
  }
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <Card className="p-4 text-sm">
        <p className="font-bold">Gửi bài nhạc nịnh</p>
        <p className="mt-2 text-muted">
          Đăng nhập Google (góc trên bên phải) để gửi link bài của bạn. Có thể xem thêm ở trang{" "}
          <Link href="/bo-toc" className="text-accent underline underline-offset-2">
            Bộ Tộc
          </Link>
          .
        </p>
      </Card>
    );
  }
  return <SongForm />;
}
