import type { ComponentProps } from "react";
import { cn } from "./cn";

/** Pill classes, shared by <Chip> and filter links (e.g. /video, where filters live in the URL). */
export function chipClass(active: boolean, className?: string): string {
  return cn(
    "inline-block rounded-pill border px-3 py-1 text-sm transition-colors duration-150",
    active ? "border-accent bg-accent text-background" : "border-border bg-surface text-muted hover:text-foreground",
    className,
  );
}

/** Toggle pill for filters and tabs. */
export function Chip({ active, className, ...props }: ComponentProps<"button"> & { active: boolean }) {
  return <button type="button" aria-pressed={active} className={chipClass(active, className)} {...props} />;
}
