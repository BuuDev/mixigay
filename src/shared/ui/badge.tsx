import type { ReactNode } from "react";
import { LiveDot } from "../motion/live-dot";
import { cn } from "./cn";

export type BadgeTone = "accent" | "live" | "cleared" | "steam" | "viewer" | "misc" | "muted" | "danger";

const tones: Record<BadgeTone, string> = {
  accent: "bg-accent/15 text-accent",
  live: "bg-live-fill text-white",
  cleared: "bg-cleared/15 text-cleared",
  steam: "bg-steam/15 text-steam",
  viewer: "bg-viewer/15 text-viewer",
  misc: "bg-misc/15 text-misc",
  muted: "bg-surface-raised text-muted",
  danger: "bg-live/15 text-live-text",
};

export function Badge({ tone = "muted", icon, className, children }: { tone?: BadgeTone; icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** "ĐANG LIVE · 12.400" — the only place the live colour is used as a fill. */
export function LiveBadge() {
  return (
    <Badge tone="live" icon={<LiveDot className="text-white" />}>
      ĐANG LIVE
    </Badge>
  );
}
