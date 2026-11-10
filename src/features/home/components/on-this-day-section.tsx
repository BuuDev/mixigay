import { connection } from "next/server";
import { getVideos } from "@/features/videos/server/queries";
import { IconTimeline } from "@/shared/ui/icons";
import { SectionHeader } from "@/shared/ui/section-header";
import { pickOnThisDay } from "../lib/on-this-day";
import { OnThisDay } from "./on-this-day";

/** "Hôm nay năm xưa". Reads the request time, so it must render under <Suspense>. */
export async function OnThisDaySection() {
  await connection(); // "today" is per request, never the build time
  const pick = pickOnThisDay(await getVideos(), new Date());
  if (!pick) return null;
  return (
    <>
      <SectionHeader eyebrow="Nhìn lại" title="Hôm nay năm xưa" icon={<IconTimeline size={26} className="text-accent" />} />
      <OnThisDay pick={pick} />
    </>
  );
}
