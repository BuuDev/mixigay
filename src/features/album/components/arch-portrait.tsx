"use client";

import { SmartImage as Image } from "@/shared/ui/smart-image";
import { useRef } from "react";
import { cn } from "@/shared/ui/cn";
import { m, useReducedMotion, useScroll, useTransform } from "@/shared/motion";
import type { AlbumPhoto } from "../lib/photos";

/**
 * The couple-portrait of an e-invitation, for anh Độ: an arched frame with a slow
 * push-in, a light sweep and a gentle parallax while the page scrolls. All ambient
 * motion stops for reduced-motion users.
 */
export function ArchPortrait({ photo, className, priority = false }: { photo: AlbumPhoto; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-18, 18]);

  return (
    <figure className={cn("relative mx-auto w-full max-w-[18rem]", className)}>
      <div className="relative">
        {/* Outer ring: a thin ember line that follows the arch. */}
        <div aria-hidden className="absolute -inset-2 rounded-t-full border border-accent/40" />
        <div
          ref={ref}
          className="relative aspect-[3/4] overflow-hidden rounded-t-full border-2 border-accent/70 bg-surface shadow-[0_0_40px_-8px_var(--td-ember)]"
        >
          <m.div style={{ y }} className="absolute -inset-6">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 640px) 18rem, 80vw"
              preload={priority}
              className="object-cover object-top motion-safe:animate-td-kenburns"
            />
          </m.div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-td-sheen"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">
        {photo.caption}
        <span className="block text-[11px]">{photo.credit}</span>
      </figcaption>
    </figure>
  );
}
