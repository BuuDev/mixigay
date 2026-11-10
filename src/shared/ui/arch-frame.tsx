import type { ReactNode } from "react";
import { cn } from "./cn";

/** Arched window frame (invitation-style) for a hero image or illustration. */
export function ArchFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-t-[999px] rounded-b-lg border border-border bg-surface-raised shadow-card", className)}>
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-accent/20 ring-inset" />
    </div>
  );
}
