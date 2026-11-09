import type { Metadata } from "next";
import { CharityCard } from "@/features/charity/components/charity-card";
import { CommunityLinks } from "@/features/tribe/components/community-links";
import { GhostProjectsBoard } from "@/features/tribe/components/ghost-projects-board";
import { LoreList } from "@/features/tribe/components/lore-list";
import { TrendBoard } from "@/features/tribe/components/trend-board";
import { TribeVibe } from "@/features/tribe/components/tribe-vibe";
import { UnbanCourt } from "@/features/tribe/components/unban-court";
import { newestPublishedAt, trendingTopics } from "@/features/tribe/lib/trends";
import { VideoRail } from "@/features/videos/components/video-rail";
import { getGames, getVideos } from "@/features/videos/server/queries";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { IconCampfire, IconFanart, IconGameViewer, IconQuote, IconSuggest, IconTribe, IconWall } from "@/shared/ui/icons";
import { NeonText } from "@/shared/ui/neon-text";
import { SectionHeader } from "@/shared/ui/section-header";

export const metadata: Metadata = { title: "Bộ Tộc – Góc Bộ Tộc" };

export default async function TribePage() {
  const [videos, games] = await Promise.all([getVideos(), getGames()]);
  const topics = trendingTopics(videos, newestPublishedAt(videos)).slice(0, 8);
  const fanGames = videos.filter((v) => v.gameSlug === "viewer-made").slice(0, 8);

  return (
    <div className="space-y-16 py-6">
      <header className="text-center">
        <NeonText className="text-4xl sm:text-5xl">BỘ TỘC</NeonText>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Cộng đồng fan của Kênh MixiGaming. Trang này tổng hợp những gì Bộ Tộc đang bàn tán, từ điển “tiếng lóng” và chỗ sinh hoạt chính chủ.
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
        <SectionHeader eyebrow="Tháng 10 – 11/2026" title="Hồ sơ Dự Án Ma" icon={<IconSuggest size={26} className="text-accent" />} />
        <p className="mx-auto mb-5 max-w-2xl text-center text-sm text-muted">
          Những dự định được “vẽ” trên sóng. Bộ đếm cứ thế tăng — tới ngày có video làm thật thì đóng dấu “Đã làm thật”.
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
        <SectionHeader eyebrow="Đặc sản văn mẫu ngoài khơi" title="Tòa án Bộ Tộc · Đơn hối lỗi xin về bờ" icon={<IconWall size={26} className="text-accent" />} />
        <UnbanCourt />
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Đa nhân cách · meme · hội anh em" title="Từ điển Bộ Tộc" icon={<IconQuote size={26} className="text-accent" />} />
        <LoreList />
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
