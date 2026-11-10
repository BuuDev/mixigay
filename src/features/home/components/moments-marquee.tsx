import Image from "next/image";
import { formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { MIN_ROW, type Moment, type MomentRows } from "../lib/moments";

/**
 * "Khoảnh khắc trên sóng": two rows of real channel thumbnails drifting in opposite
 * directions (pure CSS, motion.css `.td-marquee`), paused on hover/focus. Reduced
 * motion gets a still, scrollable row. Every tile links out to YouTube (never embedded).
 * Server component: only the ~24 picked tiles are rendered, nothing ships as props.
 */
export function MomentsMarquee({ rows }: { rows: MomentRows }) {
  return (
    <div className="space-y-4">
      {rows.popular.length >= MIN_ROW && <Row label="Xem nhiều nhất" moments={rows.popular} />}
      {rows.latest.length >= MIN_ROW && <Row label="Mới lên sóng" moments={rows.latest} reverse />}
    </div>
  );
}

function Row({ label, moments, reverse = false }: { label: string; moments: Moment[]; reverse?: boolean }) {
  return (
    <div>
      <h3 className="mb-2 font-script text-xl font-semibold text-accent-glow">{label}</h3>
      {/* Full-bleed on phones so the row runs edge to edge; the mask fades both ends. */}
      <div className="td-marquee -mx-4 px-4 sm:mx-0 sm:px-0" data-reverse={reverse ? "" : undefined}>
        <div className="td-marquee-track flex w-max">
          <Tiles moments={moments} />
          {/* The loop's second half: still clickable, but hidden from assistive tech and the tab order. */}
          <Tiles moments={moments} copy />
        </div>
      </div>
    </div>
  );
}

function Tiles({ moments, copy = false }: { moments: Moment[]; copy?: boolean }) {
  return (
    <ul className={copy ? "td-marquee-copy gap-3 py-1 pr-3" : "flex gap-3 py-1 pr-3"} aria-hidden={copy || undefined}>
      {moments.map((m) => (
        <li key={m.videoId} className="w-56 shrink-0 sm:w-64">
          <a
            href={youtubeUrl(m.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={copy ? -1 : undefined}
            className="group relative block aspect-video overflow-hidden rounded-lg border border-border bg-surface-raised shadow-card transition-colors duration-150 hover:border-accent/70 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Image
              src={m.thumbnailUrl}
              alt={m.title}
              fill
              sizes="(min-width: 640px) 16rem, 14rem"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
            <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-black/75 px-1.5 py-0.5 text-xs text-white">{formatViews(m.viewCount)} lượt xem</span>
            <span className="sr-only">(mở YouTube ở tab mới)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
