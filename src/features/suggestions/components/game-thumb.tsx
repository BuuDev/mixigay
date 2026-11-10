"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/ui/cn";

/**
 * Game artwork that never shows an empty box: tries each source in order (Steam header,
 * then anh Độ's stream thumbnail of that game) and ends on a lettered tile. Steam images
 * can fail when the server cannot reach Steam (e.g. a Vietnamese ISP DNS block on a local
 * dev machine); in production the optimizer runs outside the block, so fans still see them.
 */
export function GameThumb({ sources, name, sizes, className }: { sources: (string | undefined)[]; name: string; sizes: string; className?: string }) {
  const list = sources.filter((s): s is string => Boolean(s));
  const [failed, setFailed] = useState(0);
  const src = list[failed];
  return (
    <div className={cn("relative shrink-0 self-start overflow-hidden rounded-sm bg-surface-raised", className)}>
      {src ? (
        <Image key={src} src={src} alt="" fill sizes={sizes} className="object-cover" onError={() => setFailed((n) => n + 1)} />
      ) : (
        <div
          aria-hidden
          className="flex size-full items-center justify-center bg-gradient-to-br from-accent/30 to-surface-raised text-2xl font-black text-accent"
        >
          {name.trim().charAt(0).toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}
