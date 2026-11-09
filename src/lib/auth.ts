import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "./env";
import { serverClient } from "./supabase/server";
import type { Viewer } from "./types";

/**
 * The signed-in user, or null. Dynamic (reads cookies): call it under <Suspense>.
 * Memoized per request, so layout, page and actions can all call it.
 */
export const getViewer = cache(async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: isAdmin }] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.rpc("is_admin"),
  ]);
  return {
    id: user.id,
    email: user.email,
    name: profile?.display_name ?? user.email ?? "fan",
    avatarUrl: profile?.avatar_url ?? undefined,
    isAdmin: isAdmin === true,
  };
});

/**
 * For admin pages and actions; anyone else gets a 404 so the admin area is not
 * advertised. Every admin page must call it itself: layouts and pages render in
 * parallel, so a check in the layout alone does not stop the page from streaming.
 * RLS enforces the same rule again in the database.
 */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) notFound();
  return viewer;
}

/** Suggestion ids the viewer has upvoted. */
export async function getMyVoteIds(userId: string): Promise<string[]> {
  const supabase = await serverClient();
  const { data } = await supabase.from("suggestion_votes").select("suggestion_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.suggestion_id as string);
}
