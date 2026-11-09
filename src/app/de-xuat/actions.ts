"use server";

import { revalidateTag, updateTag } from "next/cache";
import { z } from "zod";
import { TAGS } from "@/lib/data";
import { getViewer } from "@/lib/auth";
import { getSteamDetails } from "@/lib/steam-cache";
import { steamAppIdFromUrl, steamStoreUrl } from "@/lib/steam";
import { adminClient } from "@/lib/supabase/admin";
import { publicClient } from "@/lib/supabase/public";
import { serverClient } from "@/lib/supabase/server";
import { safeHttpUrl } from "@/lib/text";

export type FormResult = { ok: true; message: string } | { ok: false; message: string } | null;

const SuggestionInput = z.object({
  name: z.string().trim().min(2, "Tên game quá ngắn").max(120),
  source: z.enum(["steam", "viewer-made", "other"]),
  url: z.string().trim().max(500).optional(),
  reason: z.string().trim().min(5, "Lý do ít nhất 5 ký tự").max(500),
});

export async function createSuggestion(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Đăng nhập Google để gửi đề xuất." };

  const parsed = SuggestionInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const input = parsed.data;
  const url = safeHttpUrl(input.url);
  if (input.url && !url) return { ok: false, message: "Link phải bắt đầu bằng http:// hoặc https://" };

  const duplicate = { ok: false, message: "Game này đã có người đề xuất rồi – upvote thay vì tạo mới nhé." } as const;
  let name = input.name;
  let link = url ?? null;
  let steam: { steam_app_id: number; steam_data: { price: string; genres: string[]; headerImage?: string } } | undefined;
  if (input.source === "steam") {
    const appId = url ? steamAppIdFromUrl(url) : undefined;
    if (!appId) return { ok: false, message: "Dán link trang Steam dạng https://store.steampowered.com/app/…" };
    const { data: existing } = await publicClient().from("suggestions").select("id").eq("steam_app_id", appId).maybeSingle();
    if (existing) return duplicate;
    const details = await getSteamDetails(appId);
    if (!details) return { ok: false, message: "Không tìm thấy game này trên Steam." };
    name = details.name;
    link = steamStoreUrl(appId);
    steam = { steam_app_id: appId, steam_data: { price: details.price, genres: details.genres, headerImage: details.headerImage } };
  }

  // Fans may only write these four columns (column grants + RLS + rate-limit trigger).
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("suggestions")
    .insert({ name, source: input.source, url: link, reason: input.reason })
    .select("id")
    .single();
  if (error) {
    if (error.message.includes("rate_limited")) return { ok: false, message: "Bạn đã gửi 5 đề xuất hôm nay, mai quay lại nhé." };
    console.error("createSuggestion", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }

  if (steam) {
    // Steam data comes from our own server-side fetch, never from the form, so it is
    // written with the service role (docs/07-conventions.md, "Service role").
    const admin = adminClient();
    const { error: steamError } = await admin.from("suggestions").update(steam).eq("id", data.id).eq("author_id", viewer.id);
    if (steamError) {
      await admin.from("suggestions").delete().eq("id", data.id);
      if (steamError.code === "23505") return duplicate;
      console.error("createSuggestion steam", steamError);
      return { ok: false, message: "Có lỗi, thử lại sau." };
    }
  }

  // The author's own upvote.
  await supabase.from("suggestion_votes").insert({ suggestion_id: data.id });
  updateTag(TAGS.suggestions);
  return { ok: true, message: `Đã gửi đề xuất “${name}”.` };
}

export async function toggleVote(suggestionId: string): Promise<{ ok: boolean; message?: string }> {
  if (!z.uuid().safeParse(suggestionId).success) return { ok: false };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "Đăng nhập Google để upvote." };
  const supabase = await serverClient();
  const { data: existing } = await supabase
    .from("suggestion_votes")
    .select("suggestion_id")
    .match({ suggestion_id: suggestionId, user_id: viewer.id })
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("suggestion_votes").delete().match({ suggestion_id: suggestionId, user_id: viewer.id })
    : await supabase.from("suggestion_votes").insert({ suggestion_id: suggestionId });
  if (error) return { ok: false, message: "Có lỗi, thử lại sau." };
  // Stale-while-revalidate rather than updateTag: vote spam must not keep emptying the
  // shared cache. The voter already sees their vote through useOptimistic.
  revalidateTag(TAGS.suggestions, "max");
  return { ok: true };
}

export interface SimilarItem {
  kind: "suggestion" | "game";
  ref: string;
  name: string;
  status: string;
  upvotes: number;
}

/** "Already suggested?" hint while typing: similar suggestions and games Độ has played. */
export async function searchSimilar(query: string): Promise<SimilarItem[]> {
  const q = query.trim().slice(0, 120);
  if (q.length < 3) return [];
  const supabase = await serverClient();
  const { data } = await supabase.rpc("search_similar", { q });
  return (data ?? []) as SimilarItem[];
}
