import { cn } from "./cn";

/** One half of the flourish (left side); the right side is the same path mirrored. */
const SCROLL = "M8 16H70c10 0 14-8 22-8 6 0 9 4 9 7.5 0 3-2.4 5-5 5-2.4 0-4-1.7-4-3.6 0-1.6 1.2-2.8 2.7-2.8M70 16c8 0 12 5 19 5";

/**
 * Section divider of a wedding invitation: a thin flourish either side of a small
 * flame. Pure decoration (aria-hidden), drawn in currentColor so skins recolour it.
 */
export function Ornament({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex justify-center py-2 text-accent/70", className)}>
      <svg viewBox="0 0 240 32" width="240" height="32" fill="none" className="h-8 w-60 max-w-full">
        <g stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d={SCROLL} />
          <path d={SCROLL} transform="matrix(-1 0 0 1 240 0)" />
        </g>
        <circle cx="4" cy="16" r="1.5" fill="currentColor" />
        <circle cx="236" cy="16" r="1.5" fill="currentColor" />
        {/* Flame: outer tongue in the accent, inner core in the glow tone. */}
        <path d="M120 4c4.5 5 8 8.6 8 14a8 8 0 0 1-16 0c0-3.4 1.8-5.8 3.6-7.8.3 2 1.2 3.4 2.4 3.9 0-3.6.6-6.6 2-10.1Z" fill="currentColor" />
        <path d="M120 15.5c1.9 2 3.2 3.4 3.2 5.3a3.2 3.2 0 0 1-6.4 0c0-1.9 1.3-3.3 3.2-5.3Z" className="fill-accent-glow" />
      </svg>
    </div>
  );
}
