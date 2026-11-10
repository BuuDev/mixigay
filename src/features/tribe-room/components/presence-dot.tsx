import { cn } from "@/shared/ui/cn";

/** Solid dot with a soft expanding ring (CSS only, static under reduced motion). */
export function PresenceDot({ live = false, className }: { live?: boolean; className?: string }) {
  const tone = live ? "bg-live" : "bg-cleared";
  return (
    <span aria-hidden className={cn("relative inline-flex size-2.5 shrink-0", className)}>
      <span className={cn("absolute inset-0 rounded-full motion-safe:animate-td-ping", tone)} />
      <span className={cn("relative inline-block size-2.5 rounded-full", tone)} />
    </span>
  );
}
