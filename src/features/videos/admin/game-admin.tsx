import { getGames } from "../server/queries";
import { serverClient } from "@/server/supabase/server";
import { deleteGame, mapPlaylist, saveGame } from "./actions";
import { button, GameSelect, input, primary, Section } from "@/features/admin/ui";

export async function GameAdmin() {
  const supabase = await serverClient();
  const [games, { data: playlists }] = await Promise.all([getGames(), supabase.from("playlist_game_map").select("*").order("playlist_title")]);
  return (
    <div className="space-y-4">
      <Section title="Game & từ khóa">
        <p className="text-xs text-muted">
          Từ khóa: chữ thường, cách nhau dấu phẩy, so khớp một phần trong tiêu đề video. Game có “vlog” được xét sau cùng. Lưu xong sẽ phân loại lại toàn bộ
          video.
        </p>
        {[...games, { slug: "", name: "", keywords: [], isVlog: false, cover: "" }].map((g) => (
          <form key={g.slug || "new"} action={saveGame} className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
            <input name="slug" defaultValue={g.slug} readOnly={!!g.slug} required placeholder="slug-moi" className={`${input} w-32`} />
            <input name="name" defaultValue={g.name} required placeholder="Tên game" className={`${input} w-44`} />
            <input name="keywords" defaultValue={g.keywords.join(", ")} placeholder="từ khóa, …" className={`${input} min-w-48 flex-1`} />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="is_vlog" defaultChecked={g.isVlog} /> vlog
            </label>
            <button className={primary}>{g.slug ? "Lưu" : "Thêm game"}</button>
            {g.slug && (
              <button formAction={deleteGame.bind(null, g.slug)} className={button}>
                Xóa
              </button>
            )}
          </form>
        ))}
      </Section>
      <Section title="Playlist chính chủ → game">
        <p className="text-xs text-muted">
          Danh sách do job sync-videos lấy về. Gán game cho playlist thì mọi video trong đó được phân loại theo game ấy (ưu tiên hơn từ khóa).
        </p>
        <ul className="divide-y divide-border text-sm">
          {(playlists ?? []).map((p) => (
            <li key={p.playlist_id as string} className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-0 flex-1">{(p.playlist_title as string) ?? p.playlist_id}</span>
              <form action={mapPlaylist} className="flex gap-2">
                <input type="hidden" name="playlistId" value={p.playlist_id as string} />
                <GameSelect games={games} value={p.game_slug as string | null} empty="— không dùng —" />
                <button className={primary}>Lưu</button>
              </form>
            </li>
          ))}
          {!playlists?.length && <li className="py-2 text-muted">Chưa có. Chạy sync-videos một lần.</li>}
        </ul>
      </Section>
    </div>
  );
}
