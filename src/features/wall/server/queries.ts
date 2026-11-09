import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { check } from "@/server/supabase/check";
import { publicClient } from "@/server/supabase/public";
import { serverClient } from "@/server/supabase/server";
import { TAGS } from "@/shared/lib/cache-tags";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { mapWallMessages, WALL_SELECT, type WallMessageRow } from "../lib/mapper";
import * as mock from "../mock";
import type { WallMessage } from "../types";

/** Approved wall messages, newest first (RLS hides pending ones from the anon client). */
export async function getWallMessages(): Promise<WallMessage[]> {
  "use cache";
  cacheTag(TAGS.wall);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return mock.wallMessages;
  const rows = check<WallMessageRow[]>(
    await publicClient().from("wall_messages").select(WALL_SELECT).eq("approved", true).order("created_at", { ascending: false }).limit(60),
    "wall_messages",
  );
  return mapWallMessages(rows);
}

/** The viewer's own messages waiting for review (RLS lets authors read them). Dynamic (session): render under <Suspense>, never cache. */
export async function getMyPendingWallMessages(userId: string): Promise<WallMessage[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await serverClient();
  const { data } = await supabase
    .from("wall_messages")
    .select(WALL_SELECT)
    .eq("author_id", userId)
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(5);
  return mapWallMessages((data ?? []) as unknown as WallMessageRow[]);
}
