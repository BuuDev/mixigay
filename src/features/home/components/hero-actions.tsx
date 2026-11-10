"use client";

import { useLiveStatus } from "@/features/live/hooks/use-live-status";
import { isLiveView } from "@/features/live/lib/view";
import type { LiveStatus } from "@/features/live/types";
import { OFFICIAL_CHANNEL_URL } from "@/shared/lib/links";
import { ButtonLink } from "@/shared/ui/button";
import { IconSchedule } from "@/shared/ui/icons";

/**
 * The two links under the status card. Brand rule: ember marks exactly one primary action
 * per view. While the card shows "đang live" (its own ember button), the schedule link
 * steps back to secondary. Follows the same Realtime status as the card, so a stream that
 * starts or ends after the page loaded never leaves two ember buttons, or none.
 */
export function HeroActions({ status: initial }: { status: LiveStatus }) {
  const live = isLiveView(useLiveStatus(initial));
  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
      <ButtonLink href="/lich" variant={live ? "secondary" : "primary"} className="min-h-11">
        <IconSchedule size={20} />
        Lịch stream
      </ButtonLink>
      <ButtonLink href={OFFICIAL_CHANNEL_URL} external variant="ghost" className="min-h-11">
        Xem kênh YouTube
      </ButtonLink>
    </div>
  );
}
