import Link from "next/link";
import type { ReactNode } from "react";
import { IntroRitual } from "@/features/intro/components/intro-ritual";
import { LiveHero } from "@/features/live/components/live-hero";
import { getLiveStatus } from "@/features/live/server/queries";
import { CountdownRing } from "@/features/schedule/components/countdown-ring";
import { MonthCalendar } from "@/features/schedule/components/month-calendar";
import { WeekSchedule } from "@/features/schedule/components/week-schedule";
import { getSchedule } from "@/features/schedule/server/queries";
import { GiftBox } from "@/features/support/components/gift-box";
import { VideoRail } from "@/features/videos/components/video-rail";
import { getGames, getVideos } from "@/features/videos/server/queries";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { IconCampfire, IconGameMisc, IconSchedule, IconUpcoming } from "@/shared/ui/icons.generated";
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
  const [status, schedule, videos, games] = await Promise.all([getLiveStatus(), getSchedule(), getVideos(), getGames()]);
  const latest = [...videos].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8);

  return (
    <>
      <IntroRitual status={status} schedule={schedule} />

      <section className="flex min-h-[70svh] flex-col justify-center py-8">
        <LiveHero status={status} schedule={schedule} embers />
      </section>

      <Block id="dem-nguoc">
        <SectionHeader eyebrow="Buổi kế tiếp" title="Đếm ngược" icon={<IconUpcoming size={26} className="text-accent" />} />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <CountdownRing schedule={schedule} />
          <MonthCalendar schedule={schedule} />
        </div>
      </Block>

      <Block>
        <SectionHeader eyebrow="Giờ Việt Nam" title="Lịch tuần" icon={<IconSchedule size={26} className="text-accent" />} />
        <WeekSchedule schedule={schedule} games={games} />
        <p className="mt-4 text-center">
          <Link href="/lich" className="text-sm text-accent hover:underline">
            Xem trang lịch →
          </Link>
        </p>
      </Block>

      <Block>
        <SectionHeader eyebrow="Mới lên sóng" title="Video mới" icon={<IconGameMisc size={26} className="text-accent" />} />
        <VideoRail videos={latest} games={games} />
        <p className="mt-4 text-center">
          <Link href="/video" className="text-sm text-accent hover:underline">
            Xem theo game →
          </Link>
        </p>
      </Block>

      <Block id="ung-ho">
        <SectionHeader eyebrow="Hộp quà Bộ tộc" title="Ủng hộ Độ" icon={<IconCampfire size={26} className="text-accent" />} />
        <GiftBox />
      </Block>
    </>
  );
}
