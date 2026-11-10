import Link from "next/link";
import type { ReactNode } from "react";
import { PhotoAlbum } from "@/features/album/components/photo-album";
import { ALBUM } from "@/features/album/lib/photos";
import { AttendanceBlock } from "@/features/attendance/components/attendance-block";
import { EventRadar } from "@/features/events/components/event-radar";
import { HeroCover } from "@/features/home/components/hero-cover";
import { MomentsMarquee } from "@/features/home/components/moments-marquee";
import { channelStats, MIN_ROW, pickMoments } from "@/features/home/lib/moments";
import { IntroRitual } from "@/features/intro/components/intro-ritual";
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
import { ShortsRail } from "@/features/videos/components/shorts-rail";
import { VideoRail } from "@/features/videos/components/video-rail";
import { getGames, getShorts, getVideos } from "@/features/videos/server/queries";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { SceneArt } from "@/shared/ui/brand-art";
import { IconAlbum, IconCampfire, IconEvent, IconGameMisc, IconLive, IconSchedule, IconTimeline, IconTribe, IconUpcoming, IconVlog } from "@/shared/ui/icons";
import { Ornament } from "@/shared/ui/ornament";
import { SectionHeader } from "@/shared/ui/section-header";

/**
 * One idea per block, revealed as it scrolls in (e-invitation rhythm, spec "Nguyên tắc
 * chung"). Height follows the content: a fixed screen height left short blocks mostly empty.
 * Each block after the cover opens with the flourish divider, like the pages of a thiệp cưới.
 */
function Block({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 pt-6 pb-10 sm:pt-8 sm:pb-14">
      <Ornament className="mb-6 sm:mb-8" />
      <ScrollReveal>{children}</ScrollReveal>
    </section>
  );
}

export default async function Home() {
  const shortsPromise = getShorts(12);
  const [status, schedule, overrides, videos, games] = await Promise.all([getLiveStatus(), getSchedule(), getScheduleOverrides(), getVideos(), getGames()]);
  const shorts = await shortsPromise;
  const latest = [...videos].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8);
  const hotSeries = groupSeries(videos).slice(0, 6);
  const topics = trendingTopics(videos, newestPublishedAt(videos)).slice(0, 4);
  // Only the ~24 picked tiles reach the marquee (docs/07 "Danh sách lớn").
  const moments = pickMoments(videos, 12);
  const stats = channelStats(videos);

  return (
    <>
      <IntroRitual status={status} schedule={schedule} overrides={overrides} />

      {/* Invitation cover: anh Độ in the arch over the banner band, the evening's status beside him. */}
      <HeroCover status={status} schedule={schedule} overrides={overrides} stats={stats} />

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

      {moments.popular.length >= MIN_ROW && (
        <Block id="khoanh-khac">
          <SectionHeader eyebrow="Xem lại cùng Bộ Tộc" title="Khoảnh khắc trên sóng" icon={<IconLive size={26} className="text-accent" />} />
          <MomentsMarquee rows={moments} />
          <p className="mt-4 text-center">
            <Link href="/video" className="text-sm text-accent hover:underline">
              Xem tất cả video
            </Link>
          </p>
        </Block>
      )}

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
        <div className="grid items-center gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <SceneArt scene="06-lich-live" size={224} sizes="(min-width: 1024px) 224px, 160px" className="size-40 lg:size-56" />
            <Link href="/lich" className="text-sm text-accent hover:underline">
              Xem trang lịch
            </Link>
          </div>
          <WeekSchedule schedule={schedule} games={games} overrides={overrides} />
        </div>
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

      {shorts.length > 0 && (
        <Block>
          <SectionHeader eyebrow="Xem nhanh" title="Shorts mới" icon={<IconVlog size={26} className="text-accent" />} />
          <ShortsRail shorts={shorts} />
        </Block>
      )}

      <Block id="ung-ho">
        <SectionHeader eyebrow="Hộp quà Bộ Tộc" title="Ủng hộ anh Độ" icon={<IconCampfire size={26} className="text-accent" />} />
        <GiftBox />
      </Block>
    </>
  );
}
