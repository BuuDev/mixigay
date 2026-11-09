import Link from "next/link";
import type { ReactNode } from "react";
import { ArchPortrait } from "@/features/album/components/arch-portrait";
import { PhotoAlbum } from "@/features/album/components/photo-album";
import { ALBUM, HERO_PHOTO } from "@/features/album/lib/photos";
import { AttendanceBlock } from "@/features/attendance/components/attendance-block";
import { EventRadar } from "@/features/events/components/event-radar";
import { IntroRitual } from "@/features/intro/components/intro-ritual";
import { LiveHero } from "@/features/live/components/live-hero";
import { getLiveStatus } from "@/features/live/server/queries";
import { CountdownRing } from "@/features/schedule/components/countdown-ring";
import { MonthCalendar } from "@/features/schedule/components/month-calendar";
import { WeekSchedule } from "@/features/schedule/components/week-schedule";
import { getSchedule, getScheduleOverrides } from "@/features/schedule/server/queries";
import { SeriesRail } from "@/features/series/components/series-rail";
import { groupSeries } from "@/features/series/lib/series";
import { GiftBox } from "@/features/support/components/gift-box";
import { TrendBoard } from "@/features/tribe/components/trend-board";
import { TribeVibe } from "@/features/tribe/components/tribe-vibe";
import { newestPublishedAt, trendingTopics } from "@/features/tribe/lib/trends";
import { VideoRail } from "@/features/videos/components/video-rail";
import { getGames, getVideos } from "@/features/videos/server/queries";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { IconAlbum, IconCampfire, IconEvent, IconGameMisc, IconSchedule, IconTimeline, IconTribe, IconUpcoming } from "@/shared/ui/icons";
import { SectionHeader } from "@/shared/ui/section-header";

/** One block ≈ one phone screen, revealed as it scrolls in (e-invitation rhythm, spec "Nguyên tắc chung"). */
function Block({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex min-h-[85svh] scroll-mt-16 flex-col justify-center py-14 sm:min-h-[70vh]">
      <ScrollReveal>{children}</ScrollReveal>
    </section>
  );
}

export default async function Home() {
  const [status, schedule, overrides, videos, games] = await Promise.all([getLiveStatus(), getSchedule(), getScheduleOverrides(), getVideos(), getGames()]);
  const latest = [...videos].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8);
  const hotSeries = groupSeries(videos).slice(0, 6);
  const topics = trendingTopics(videos, newestPublishedAt(videos)).slice(0, 4);

  return (
    <>
      <IntroRitual status={status} schedule={schedule} overrides={overrides} />

      {/* Invitation cover: anh Độ in the arch, the evening's status beside him. */}
      <section className="grid min-h-[80svh] items-center gap-8 py-8 lg:grid-cols-[18rem_1fr] lg:gap-12">
        {/* No ScrollReveal here: the portrait is the LCP element and must paint before any JS. */}
        <div>
          <p className="mb-4 text-center font-script text-2xl font-semibold text-balance text-accent-glow">Góc Bộ Tộc · Tranh vẽ của fan</p>
          <ArchPortrait photo={HERO_PHOTO} priority />
        </div>
        <div>
          <h1 className="mb-4 text-center text-2xl font-black text-balance sm:text-3xl lg:text-left">Quây quần bên anh Độ Mixi</h1>
          <LiveHero status={status} schedule={schedule} overrides={overrides} embers />
        </div>
      </section>

      <Block id="dem-nguoc">
        <SectionHeader eyebrow="Buổi kế tiếp" title="Đếm ngược" icon={<IconUpcoming size={26} className="text-accent" />} />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <CountdownRing schedule={schedule} overrides={overrides} />
          <MonthCalendar schedule={schedule} overrides={overrides} />
        </div>
        <div className="mt-10">
          <AttendanceBlock schedule={schedule} overrides={overrides} />
        </div>
      </Block>

      <Block id="album">
        <SectionHeader eyebrow="Kỷ niệm của Bộ Tộc" title="Album anh Độ" icon={<IconAlbum size={26} className="text-accent" />} />
        <PhotoAlbum photos={ALBUM} />
      </Block>

      <Block>
        <SectionHeader eyebrow="Bộ Tộc đang hóng" title="Radar sự kiện" icon={<IconEvent size={26} className="text-accent" />} />
        <EventRadar />
        <p className="mt-4 text-center">
          <Link href="/bo-toc" className="text-sm text-accent hover:underline">
            Hồ sơ Dự Án Ma & Góp Gạch Xây Trường
          </Link>
        </p>
      </Block>

      <Block>
        <SectionHeader eyebrow="Giờ Việt Nam" title="Lịch tuần" icon={<IconSchedule size={26} className="text-accent" />} />
        <WeekSchedule schedule={schedule} games={games} overrides={overrides} />
        <p className="mt-4 text-center">
          <Link href="/lich" className="text-sm text-accent hover:underline">
            Xem trang lịch
          </Link>
        </p>
      </Block>

      <Block>
        <SectionHeader eyebrow="30 ngày gần đây" title="Bộ Tộc đang rần rần" icon={<IconTribe size={26} className="text-accent" />} />
        <div className="mb-4">
          <TribeVibe />
        </div>
        <TrendBoard topics={topics} />
        <p className="mt-4 text-center">
          <Link href="/bo-toc" className="text-sm text-accent hover:underline">
            Từ điển & góc Bộ Tộc
          </Link>
        </p>
      </Block>

      {hotSeries.length > 0 && (
        <Block>
          <SectionHeader eyebrow="Có tập mới" title="Series đang hot" icon={<IconTimeline size={26} className="text-accent" />} />
          <SeriesRail series={hotSeries} />
          <p className="mt-4 text-center">
            <Link href="/series" className="text-sm text-accent hover:underline">
              Tất cả series · Góc nhạc An Liễng
            </Link>
          </p>
        </Block>
      )}

      <Block>
        <SectionHeader eyebrow="Mới lên sóng" title="Video mới" icon={<IconGameMisc size={26} className="text-accent" />} />
        <VideoRail videos={latest} games={games} />
        <p className="mt-4 text-center">
          <Link href="/video" className="text-sm text-accent hover:underline">
            Xem theo game
          </Link>
        </p>
      </Block>

      <Block id="ung-ho">
        <SectionHeader eyebrow="Hộp quà Bộ Tộc" title="Ủng hộ anh Độ" icon={<IconCampfire size={26} className="text-accent" />} />
        <GiftBox />
      </Block>
    </>
  );
}
