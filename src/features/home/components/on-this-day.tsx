import { SmartImage as Image } from "@/shared/ui/smart-image";
import { RevealItem, ScrollReveal } from "@/shared/motion/scroll-reveal";
import { formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { IconLive, IconVlog } from "@/shared/ui/icons";
import { yearsAgoLabel, type OnThisDayPick, type OnThisDayVideo } from "../lib/on-this-day";

/**
 * "Hôm nay năm xưa": a horizontal timeline of earlier years with the videos the
 * channel put out on this day (from `pickOnThisDay`, only those, never the full list).
 * Every card links out to YouTube (never embedded). Years cascade in once on scroll.
 * Renders nothing when there is no pick. Year labels are <h3>: place it under an <h2>
 * (the home page's SectionHeader).
 */
export function OnThisDay({ pick }: { pick: OnThisDayPick | null }) {
  if (!pick || pick.years.length === 0) return null;
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "thin" }}>
      <ScrollReveal cascade className="relative flex w-max snap-x snap-mandatory gap-6">
        {/* The timeline's thread, behind the year dots. */}
        <span className="pointer-events-none absolute top-[0.6rem] right-0 left-0 border-t border-dashed border-border" aria-hidden />
        {pick.years.map((group) => (
          <RevealItem key={group.year} className="relative snap-start">
            <div className="mb-3 flex items-center gap-2">
              <span className="relative z-10 size-5 rounded-full border-2 border-accent bg-background" aria-hidden />
              <h3 className="font-script text-xl font-semibold text-accent-glow">
                {yearsAgoLabel(group.yearsAgo, pick.mode)}
                <span className="ml-2 font-sans text-sm font-normal text-muted">({group.year})</span>
              </h3>
            </div>
            <ul className="flex gap-3">
              {group.videos.map((v) => (
                <li key={v.videoId} className="w-60 shrink-0 sm:w-64">
                  <Card video={v} />
                </li>
              ))}
            </ul>
          </RevealItem>
        ))}
      </ScrollReveal>
    </div>
  );
}

function Card({ video }: { video: OnThisDayVideo }) {
  return (
    <a
      href={youtubeUrl(video.videoId)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-colors duration-150 hover:border-accent/70 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="relative block aspect-video overflow-hidden bg-surface-raised">
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          sizes="(min-width: 640px) 16rem, 15rem"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-black/75 px-1.5 py-0.5 text-xs text-white">{formatViews(video.viewCount)} lượt xem</span>
      </span>
      <span className="flex items-start gap-2 p-3">
        {video.wasLive ? <IconLive size={18} className="mt-0.5 shrink-0 text-accent" /> : <IconVlog size={18} className="mt-0.5 shrink-0 text-accent" />}
        <span className="line-clamp-2 text-sm font-medium">{video.title}</span>
      </span>
      <span className="sr-only">{video.wasLive ? "(buổi live, " : "("}mở YouTube ở tab mới)</span>
    </a>
  );
}
