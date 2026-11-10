import Image from "next/image";
import { ArchPortrait } from "@/features/album/components/arch-portrait";
import { HERO_PHOTO } from "@/features/album/lib/photos";
import { LiveHero } from "@/features/live/components/live-hero";
import type { LiveStatus } from "@/features/live/types";
import type { ScheduleOverride, ScheduleSlot } from "@/features/schedule/types";
import { formatViews } from "@/shared/lib/format";
import { OFFICIAL_CHANNEL_URL } from "@/shared/lib/links";
import { ButtonLink } from "@/shared/ui/button";
import { IconSchedule } from "@/shared/ui/icons";

const count = new Intl.NumberFormat("vi-VN");

/**
 * Invitation cover: a band of the channel banner's doodle pattern behind anh Độ in the
 * arch, and beside him the badge, the evening's status, where to go next and a few real
 * numbers counted from the videos the site has.
 *
 * LCP: the arch portrait is the LCP element (`priority`, never inside ScrollReveal). The
 * banner is requested at ≤ 640px wide (sizes="200px") and blurred, so its LCP weight (natural size) stays
 * far below the portrait's while it still reads as a soft pattern.
 */
export function HeroCover({
  status,
  schedule,
  overrides,
  stats,
}: {
  status: LiveStatus;
  schedule: ScheduleSlot[];
  overrides?: ScheduleOverride[];
  stats: { videos: number; streams: number; views: number };
}) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-6 py-10 sm:py-14 lg:flex lg:min-h-[72svh] lg:items-center">
      <HeroBand />
      <div className="grid w-full items-center gap-8 lg:grid-cols-[18rem_1fr] lg:gap-14">
        <div>
          <p className="mb-4 text-center font-script text-2xl font-semibold text-balance text-accent-glow">Góc Bộ Tộc · Tranh vẽ của fan</p>
          <ArchPortrait photo={HERO_PHOTO} priority />
        </div>
        <div className="flex flex-col items-center gap-5 lg:items-start">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left lg:items-center">
            <Image
              src="/brand/official/mixigaming-badge.webp"
              alt="Logo Kênh MixiGaming"
              width={72}
              height={72}
              className="size-16 shrink-0 rounded-full shadow-[0_0_24px_-6px_var(--td-ember)] sm:size-[72px]"
            />
            <div>
              <h1 id="hero-title" className="text-3xl font-black text-balance sm:text-4xl">
                Quây quần bên anh Độ Mixi
              </h1>
              <p className="mt-1 text-muted">Lịch live, video mới và chuyện Bộ Tộc, gom về một góc do fan làm.</p>
            </div>
          </div>
          <div className="w-full">
            <LiveHero status={status} schedule={schedule} overrides={overrides} embers />
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/lich" size="lg" className="min-h-11">
              <IconSchedule size={22} />
              Lịch stream
            </ButtonLink>
            <ButtonLink href={OFFICIAL_CHANNEL_URL} external variant="secondary" size="lg" className="min-h-11">
              Xem kênh YouTube
            </ButtonLink>
          </div>
          {stats.videos > 0 && (
            <dl className="grid w-full grid-cols-3 gap-3 text-center lg:max-w-lg lg:text-left">
              <Stat value={count.format(stats.videos)} label="video Góc Bộ Tộc đã lưu" />
              <Stat value={count.format(stats.streams)} label="buổi live xem lại được" />
              <Stat value={formatViews(stats.views)} label="lượt xem cộng lại" />
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse rounded-md border border-border bg-surface/80 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono text-xl font-black tabular-nums sm:text-2xl">{value}</dd>
    </div>
  );
}

/**
 * Full-bleed backdrop without horizontal scroll: the tint reaches the screen edges through
 * an outset border-image (painted, never scrollable overflow), and the banner pattern fades
 * out at the sides and the bottom into that tint.
 */
const BLEED_TINT = "linear-gradient(to bottom, color-mix(in srgb, var(--td-panel) 70%, transparent), var(--td-night)) fill 0 // 0 100vmax";

function HeroBand() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0" style={{ borderImage: BLEED_TINT }} />
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <Image src="/brand/official/channel-banner.webp" alt="" fill sizes="200px" className="scale-110 object-cover object-left blur-[2px] grayscale" />
          {/* 82 % night over the grey doodles: muted text stays ≈ 5.3:1, cream ≈ 12:1 (left crop has no white areas). */}
          <div className="absolute inset-0 bg-background/[0.82]" />
        </div>
      </div>
    </div>
  );
}
