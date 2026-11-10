import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/server/viewer";
import { CharityCard } from "@/features/charity/components/charity-card";
import { FanArtForm, FanArtGallery } from "@/features/fan-art/components/fan-art-section";
import { getFanArt } from "@/features/fan-art/server/queries";
import { GlossarySection } from "@/features/glossary/components/glossary-section";
import { QuizBoard } from "@/features/quiz/components/quiz-board";
import { QuizComposer, QuizSignInCard } from "@/features/quiz/components/quiz-composer";
import { getQuizLinks } from "@/features/quiz/server/queries";
import { CommunityLinks } from "@/features/tribe/components/community-links";
import { GhostProjectsBoard } from "@/features/tribe/components/ghost-projects-board";
import { TrendBoard } from "@/features/tribe/components/trend-board";
import { TribeVibe } from "@/features/tribe/components/tribe-vibe";
import { newestPublishedAt, trendingTopics } from "@/features/tribe/lib/trends";
import { VideoRail } from "@/features/videos/components/video-rail";
import { getGames, getVideos } from "@/features/videos/server/queries";
import { WallSection } from "@/features/wall/components/wall-section";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { SceneArt } from "@/shared/ui/brand-art";
import { Card } from "@/shared/ui/card";
import { IconAlbum, IconCampfire, IconCleared, IconFanart, IconGameViewer, IconQuote, IconSuggest, IconTribe, IconWall } from "@/shared/ui/icons";
import { NeonText } from "@/shared/ui/neon-text";
import { SectionHeader } from "@/shared/ui/section-header";

export const metadata: Metadata = { title: "Bộ Tộc – Góc Bộ Tộc" };

export default async function TribePage() {
  const [videos, games, fanArt, quizLinks] = await Promise.all([getVideos(), getGames(), getFanArt(), getQuizLinks()]);
  const topics = trendingTopics(videos, newestPublishedAt(videos)).slice(0, 8);
  const fanGames = videos.filter((v) => v.gameSlug === "viewer-made").slice(0, 8);

  return (
    <div className="space-y-16 py-6">
      <header className="text-center">
        <SceneArt scene="19-cong-dong-bo-toc" size={160} sizes="(min-width: 640px) 160px, 112px" className="mx-auto mb-3 size-28 sm:size-40" />
        <NeonText className="text-4xl sm:text-5xl">BỘ TỘC</NeonText>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Cộng đồng fan của Kênh MixiGaming. Trang này tổng hợp những gì Bộ Tộc đang bàn tán, quiz fan làm cho anh Độ chơi, phòng tranh fan vẽ, từ điển “tiếng
          lóng” và chỗ sinh hoạt chính chủ.
        </p>
      </header>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="30 ngày gần đây" title="Bộ Tộc đang rần rần" icon={<IconTribe size={26} className="text-accent" />} />
        <div className="mb-4">
          <TribeVibe />
        </div>
        <TrendBoard topics={topics} />
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Fan làm, anh Độ chơi" title="Quiz Bộ Tộc làm cho anh Độ" icon={<IconCleared size={26} className="text-accent" />} />
        <p className="mx-auto mb-5 max-w-2xl text-center text-sm text-muted">
          Bộ câu hỏi anh em tự làm trên Kahoot, Wayground (Quizizz), Wordwall, Quizlet, Blooket hay Google Forms. Góc Bộ Tộc chỉ giữ link, bấm vào là chơi ngay
          trên trang gốc.
        </p>
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <QuizBoard links={quizLinks} />
          <div className="self-start lg:sticky lg:top-20">
            <Suspense fallback={<QuizSignInCard />}>
              <QuizSubmitBox />
            </Suspense>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader
          eyebrow="Lưu trên Google Drive cá nhân · Xem trực tiếp"
          title="Phòng tranh Fan Art Bộ Tộc"
          icon={<IconAlbum size={26} className="text-accent" />}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <FanArtGallery items={fanArt} />
          <Suspense fallback={null}>
            <FanArtSubmitBox />
          </Suspense>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Lưu bút · tối đa 140 ký tự" title="Bức tường Bộ Tộc" icon={<IconWall size={26} className="text-accent" />} />
        <WallSection />
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Tháng 10 – 11/2026" title="Hồ sơ Dự Án Ma · Bộ Tộc vẫn hóng" icon={<IconSuggest size={26} className="text-accent" />} />
        <p className="mx-auto mb-5 max-w-2xl text-center text-sm text-muted">
          Những dự định thú vị anh Độ từng chia sẻ trên sóng mà anh em Bộ Tộc vẫn đang hào hứng chờ ngày lên hình. Khi nào có video thực hiện sẽ được đóng dấu
          “Đã làm thật” thật nổi!
        </p>
        <GhostProjectsBoard />
      </ScrollReveal>

      {fanGames.length > 0 && (
        <ScrollReveal as="section">
          <SectionHeader eyebrow="Fan làm – anh Độ chơi" title="Game Bộ Tộc tự làm" icon={<IconGameViewer size={26} className="text-accent" />} />
          <VideoRail videos={fanGames} games={games} />
        </ScrollReveal>
      )}

      <ScrollReveal as="section">
        <SectionHeader
          eyebrow="Đặc sản văn mẫu ngoài khơi"
          title="Tòa án Ân xá · Đơn hối lỗi xin về bờ"
          icon={<IconWall size={26} className="text-accent" />}
        />
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="max-w-xl space-y-1">
            <h3 className="font-bold">Bị tiễn ra đảo vì lỡ tay spam hoặc chỉ bài?</h3>
            <p className="text-sm text-muted">
              Mục Tòa án Ân xá nay đã có tab riêng để anh em thoải mái chọn tội danh, chọn trường phái viết tâm thư và nhận phán quyết giả lập.
            </p>
          </div>
          <Link href="/an-xa" className="rounded-pill bg-accent px-4 py-2 text-sm font-bold text-background transition-transform hover:-translate-y-0.5">
            Vào Tòa án Ân xá →
          </Link>
        </Card>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Đa nhân cách · meme · hội anh em" title="Từ điển Bộ Tộc" icon={<IconQuote size={26} className="text-accent" />} />
        <GlossarySection />
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Niềm tự hào của Bộ Tộc" title="Góp Gạch Xây Trường" icon={<IconCampfire size={26} className="text-accent" />} />
        <CharityCard />
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Chính chủ" title="Sinh hoạt ở đâu?" icon={<IconFanart size={26} className="text-accent" />} />
        <CommunityLinks />
      </ScrollReveal>
    </div>
  );
}

async function QuizSubmitBox() {
  if (!isSupabaseConfigured) return <QuizSignInCard demo />;
  const viewer = await getViewer();
  if (!viewer) return <QuizSignInCard />;
  return <QuizComposer viewerId={viewer.id} />;
}

async function FanArtSubmitBox() {
  if (!isSupabaseConfigured) {
    return (
      <Card className="p-4 text-sm">
        <p className="font-bold">Gửi tranh Fan Art qua Google Drive</p>
        <p className="mt-2 text-muted">Chế độ demo: chưa nối Supabase nên chưa gửi được link tranh mới.</p>
      </Card>
    );
  }
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <Card className="p-4 text-sm">
        <p className="font-bold">Gửi tranh Fan Art qua Google Drive</p>
        <p className="mt-2 text-muted">
          Bấm “Vào Bộ Tộc” (góc trên bên phải) để gửi link ảnh trên Google Drive cá nhân (bật chế độ “Bất kỳ ai có đường liên kết đều xem được”).
        </p>
      </Card>
    );
  }
  return <FanArtForm />;
}
