import "server-only";
import { getVideos } from "@/features/videos/server/queries";
import { groupSeries, type Series } from "../lib/series";

/** Series derived from video titles (getVideos is already cached). */
export async function getSeries(): Promise<Series[]> {
  return groupSeries(await getVideos());
}

export async function getSeriesBySlug(slug: string): Promise<Series | undefined> {
  return (await getSeries()).find((s) => s.slug === slug);
}
