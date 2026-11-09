"use client";

import { useNow } from "@/shared/hooks/use-now";
import { CountUp } from "@/shared/motion/count-up";
import { hudDigits, hypeStars } from "../lib/hud";

/**
 * Game-HUD overlay for the live thumbnail: clock, viewer counter in fixed-width
 * digits that roll on change, and 0–5 "hype" stars. An original take on the
 * open-world-game HUD look; no game art or fonts are used.
 */
export function LiveHud({ viewers }: { viewers: number }) {
  const now = useNow();
  const stars = hypeStars(viewers);
  return (
    <div className="absolute right-2 bottom-2 flex flex-col items-end gap-0.5 font-mono text-sm font-black drop-shadow-[0_2px_0_rgb(0_0_0/0.8)]">
      <span className="text-foreground tabular-nums">{now ? now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
      <span className="text-cleared tabular-nums" aria-label={`${viewers} người đang xem`}>
        👁 <CountUp value={viewers} format={(n) => hudDigits(n)} />
      </span>
      <span aria-label={`Độ hype ${stars}/5`} className="tracking-tight">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < stars ? "text-viewer" : "text-white/25"}>
            ★
          </span>
        ))}
      </span>
    </div>
  );
}
