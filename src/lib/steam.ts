import type { SteamInfo } from "./types";

/** App id from a Steam store link; only https://store.steampowered.com/app/<id>… qualifies. */
export function steamAppIdFromUrl(raw: string): number | undefined {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" || url.hostname !== "store.steampowered.com") return undefined;
  const id = url.pathname.match(/^\/app\/(\d{1,8})(?:\/|$)/)?.[1];
  return id ? Number(id) : undefined;
}

export function steamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}/`;
}

interface AppDetailsResponse {
  [appId: string]: {
    success: boolean;
    data?: {
      name: string;
      header_image?: string;
      is_free?: boolean;
      price_overview?: { final_formatted?: string };
      genres?: { description: string }[];
    };
  };
}

export type SteamDetails = SteamInfo & { name: string };

/** Maps a Steam `appdetails` response; undefined when the app is unknown. */
export function parseAppDetails(appId: number, body: AppDetailsResponse): SteamDetails | undefined {
  const entry = body[String(appId)];
  if (!entry?.success || !entry.data) return undefined;
  const d = entry.data;
  return {
    appId,
    name: d.name,
    headerImage: d.header_image,
    price: d.is_free ? "Miễn phí" : (d.price_overview?.final_formatted ?? "Chưa rõ giá"),
    genres: (d.genres ?? []).map((g) => g.description),
  };
}

export async function fetchSteamDetails(appId: number): Promise<SteamDetails | undefined> {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=vn&l=vietnamese`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return undefined;
  return parseAppDetails(appId, (await res.json()) as AppDetailsResponse);
}
