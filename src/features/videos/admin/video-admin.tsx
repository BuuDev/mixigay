import { getGames } from "../server/queries";
import { formatViews } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { serverClient } from "@/server/supabase/server";
import { setVideoGame } from "./actions";
import { GameSelect, input, primary, Section } from "@/features/admin/ui";

export async function VideoAdmin({ search }: { search: string }) {
  const q = search.trim().slice(0, 100);
  const supabase = await serverClient();
  let query = supabase
    .from("videos")
    .select("video_id, title, view_count, published_at, manual_game_slug, auto_game_slug")
    .order("published_at", { ascending: false })
    .limit(100);
  query = q ? query.ilike("title", `%${q.replace(/[%_]/g, "")}%`) : query.is("manual_game_slug", null).is("auto_game_slug", null);
  const [{ data: videos }, games] = await Promise.all([query, getGames()]);

  return (
    <Section title={q ? `Kết quả cho “${q}”` : "Video chưa phân loại"}>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Tìm theo tiêu đề để gán lại game" className={`${input} flex-1`} />
        <button className={primary}>Tìm</button>
      </form>
      <ul className="divide-y divide-border text-sm">
        {(videos ?? []).map((v) => (
          <li key={v.video_id as string} className="flex flex-wrap items-center gap-3 py-2">
            <a href={youtubeUrl(v.video_id as string)} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:underline">
              {v.title as string}
              <span className="ml-2 text-xs text-muted">
                {formatViews(v.view_count as number)} · tự động: {(v.auto_game_slug as string) ?? "—"}
              </span>
            </a>
            <form action={setVideoGame} className="flex gap-2">
              <input type="hidden" name="videoId" value={v.video_id as string} />
              <GameSelect games={games} value={v.manual_game_slug as string | null} empty="— theo tự động —" />
              <button className={primary}>Lưu</button>
            </form>
          </li>
        ))}
        {!videos?.length && <li className="py-2 text-muted">Không có video nào.</li>}
      </ul>
    </Section>
  );
}
