import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchSteamDetails, type SteamDetails } from "./steam";

/** Steam appdetails, cached for a week and shared by every visitor. */
export async function getSteamDetails(appId: number): Promise<SteamDetails | null> {
  "use cache";
  cacheTag(`steam-${appId}`);
  const details = (await fetchSteamDetails(appId)) ?? null;
  // Misses are cached briefly so made-up ids cannot pin entries for weeks.
  if (details) cacheLife("weeks");
  else cacheLife("minutes");
  return details;
}
