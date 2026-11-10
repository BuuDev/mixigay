import "server-only";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/shared/lib/cache-tags";
import { uploadsPlaylistId } from "@/server/youtube/parse";
import { reclassifyAll } from "./classifier";
import type { JobContext } from "@/server/jobs/context";
import { toVideoColumns } from "../lib/video-row";

const RECENT_DAYS = 90;
const STALE_DAYS = 7;
const STALE_BATCH = 300;
const INCREMENTAL_MAX_PAGES = 5;
const FULL_MAX_PAGES = 200;
const PLAYLIST_MAX_PAGES = 20;

export interface SyncVideosResult {
  newVideos: number;
  refreshed: number;
  playlists: number;
  reclassified: number;
}

/** New uploads, view counts, playlist membership, classification. See docs/02-architecture.md, flow 2. */
export async function syncVideos({ db, yt, channelId }: JobContext, now: Date, opts: { full?: boolean } = {}): Promise<SyncVideosResult> {
  // 1. New uploads: walk the uploads playlist until a page contains a video we already have.
  const newIds: string[] = [];
  const maxPages = opts.full ? FULL_MAX_PAGES : INCREMENTAL_MAX_PAGES;
  let token: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const { ids, nextPageToken } = await yt.playlistPage(uploadsPlaylistId(channelId), token);
    const { data } = await db.from("videos").select("video_id").in("video_id", ids);
    const known = new Set(((data ?? []) as { video_id: string }[]).map((r) => r.video_id));
    newIds.push(...ids.filter((id) => !known.has(id)));
    if ((!opts.full && known.size > 0) || !nextPageToken) break;
    token = nextPageToken;
  }

  // 2. Refresh stats: everything recent, plus a batch of older videos not updated for a week.
  const day = 86_400_000;
  const [recentRes, staleRes] = await Promise.all([
    db
      .from("videos")
      .select("video_id")
      .gte("published_at", new Date(now.getTime() - RECENT_DAYS * day).toISOString()),
    db
      .from("videos")
      .select("video_id")
      .or(`stats_updated_at.is.null,stats_updated_at.lt.${new Date(now.getTime() - STALE_DAYS * day).toISOString()}`)
      .order("stats_updated_at", { ascending: true, nullsFirst: true })
      .limit(STALE_BATCH),
  ]);
  const ids = [
    ...new Set([
      ...newIds,
      ...((recentRes.data ?? []) as { video_id: string }[]).map((r) => r.video_id),
      ...((staleRes.data ?? []) as { video_id: string }[]).map((r) => r.video_id),
    ]),
  ];
  // videos.list part=snippet already carries the description, so chapters come along for free (toVideoColumns).
  const items = ids.length ? await yt.videos(ids) : [];
  for (let i = 0; i < items.length; i += 500) {
    const rows = items.slice(i, i + 500).map((v) => toVideoColumns(v, now));
    const up = await db.from("videos").upsert(rows, { onConflict: "video_id" });
    if (up.error) throw new Error(`videos upsert: ${up.error.message}`);
  }

  // 3. Official playlists: record them for the admin to map, then refresh membership of mapped ones.
  let playlistToken: string | undefined;
  for (let page = 0; page < PLAYLIST_MAX_PAGES; page++) {
    const { playlists, nextPageToken } = await yt.channelPlaylists(channelId, playlistToken);
    if (playlists.length) {
      await db.from("playlist_game_map").upsert(
        playlists.map((p) => ({ playlist_id: p.id, playlist_title: p.title })),
        { onConflict: "playlist_id" },
      );
    }
    if (!nextPageToken) break;
    playlistToken = nextPageToken;
  }
  const { data: mapped } = await db.from("playlist_game_map").select("playlist_id").not("game_slug", "is", null);
  for (const { playlist_id } of (mapped ?? []) as { playlist_id: string }[]) {
    const members: string[] = [];
    let t: string | undefined;
    for (let page = 0; page < PLAYLIST_MAX_PAGES; page++) {
      const { ids: pageIds, nextPageToken } = await yt.playlistPage(playlist_id, t);
      members.push(...pageIds);
      if (!nextPageToken) break;
      t = nextPageToken;
    }
    const { error } = await db.rpc("set_playlist_members", { p_playlist_id: playlist_id, p_video_ids: members });
    if (error) throw new Error(`set_playlist_members: ${error.message}`);
  }

  // 4. Classification.
  const reclassified = await reclassifyAll(db);
  revalidateTag(TAGS.videos, "max");
  return { newVideos: newIds.length, refreshed: items.length, playlists: mapped?.length ?? 0, reclassified };
}
