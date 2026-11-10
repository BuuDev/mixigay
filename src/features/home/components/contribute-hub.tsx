import Link from "next/link";
import { RevealItem, ScrollReveal } from "@/shared/motion/scroll-reveal";
import { Mascot } from "@/shared/ui/brand-art";
import { CONTRIBUTE_TILES, tileStat, type ContributeCounts, type ContributeTile } from "../lib/contribute";
import { getContributeCounts } from "../server/contribute";

/**
 * "Góp sức cùng Bộ Tộc": six big doors to what fans can add to the site, each with the
 * real number of approved items (mock data says so). Server-rendered; the tiles cascade
 * in once (ScrollReveal), and hover lift/glow/bob are CSS transitions behind motion-safe.
 */
export async function ContributeHub() {
  const { counts, demo } = await getContributeCounts();
  return (
    <ScrollReveal cascade className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
      {CONTRIBUTE_TILES.map((tile) => (
        <RevealItem key={tile.kind} className="h-full">
          <ContributeTileCard tile={tile} counts={counts} demo={demo} />
        </RevealItem>
      ))}
    </ScrollReveal>
  );
}

function ContributeTileCard({ tile, counts, demo }: { tile: ContributeTile; counts: ContributeCounts; demo: boolean }) {
  const stat = tileStat(tile, counts, demo);
  return (
    <Link
      href={tile.href}
      className="group relative isolate flex h-full flex-col gap-2 overflow-hidden rounded-lg border border-border bg-surface p-3.5 shadow-card transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_36px_-10px_var(--td-ember)] focus-visible:-translate-y-1 focus-visible:border-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0 sm:gap-3 sm:p-5"
    >
      {/* Ember glow that warms up on hover (opacity only). */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 -z-10 size-44 rounded-full bg-accent/25 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      />
      <div className="flex items-start justify-between gap-2">
        <Mascot
          pose={tile.pose}
          size={72}
          decorative
          sizes="(min-width: 640px) 72px, 56px"
          className="size-14 shrink-0 drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)] sm:size-[72px] motion-safe:group-hover:animate-td-bob motion-safe:group-focus-visible:animate-td-bob"
        />
      </div>
      <h3 className="text-base leading-tight font-black text-balance sm:text-xl">{tile.title}</h3>
      <p className="line-clamp-3 text-xs text-muted sm:text-sm">{tile.action}</p>
      {stat.type === "count" ? (
        <p className="flex flex-wrap items-baseline gap-x-1.5 leading-tight">
          <span className="font-mono text-2xl font-black text-accent-glow tabular-nums sm:text-3xl">{stat.value}</span>
          <span className="text-xs text-muted">{stat.label}</span>
        </p>
      ) : (
        <p className="text-xs leading-snug font-semibold text-accent-glow sm:text-sm">{stat.text}</p>
      )}
      <span className="mt-auto inline-flex min-h-11 items-center justify-center rounded-pill bg-accent px-3 text-sm font-bold text-background transition-[filter] duration-200 group-hover:brightness-110 motion-reduce:transition-none">
        {tile.cta}
      </span>
    </Link>
  );
}
