import { getGames } from "@/features/videos/server/queries";
import { getPlayedGames } from "../server/queries";
import { deletePlayed, savePlayed } from "./actions";
import { button, GameSelect, input, primary, Section } from "@/features/admin/ui";

const STATUS = [
  ["playing", "Đang chơi"],
  ["finished", "Phá đảo"],
  ["dropped", "Drop"],
] as const;

export async function PlayedAdmin() {
  const [played, games] = await Promise.all([getPlayedGames(), getGames()]);
  const name = new Map(games.map((g) => [g.slug, g.name]));
  return (
    <Section title="Anh Độ đã chơi">
      {played.map((p) => (
        <form key={p.gameSlug} action={savePlayed} className="flex flex-wrap items-center gap-2 border-t border-border pt-2 text-sm">
          <input type="hidden" name="game" value={p.gameSlug} />
          <span className="w-44">{name.get(p.gameSlug) ?? p.gameSlug}</span>
          <select name="status" defaultValue={p.status} className={input}>
            {STATUS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input name="sessions" type="number" min={0} defaultValue={p.sessions} className={`${input} w-20`} />
          <input name="last_played" type="date" defaultValue={p.lastPlayed} className={input} />
          <button className={primary}>Lưu</button>
          <button formAction={deletePlayed.bind(null, p.gameSlug)} className={button}>
            Xóa
          </button>
        </form>
      ))}
      <form action={savePlayed} className="flex flex-wrap items-center gap-2 border-t border-border pt-2 text-sm">
        <GameSelect games={games.filter((g) => !played.some((p) => p.gameSlug === g.slug))} empty="— thêm game —" />
        <select name="status" defaultValue="playing" className={input}>
          {STATUS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input name="sessions" type="number" min={0} defaultValue={1} className={`${input} w-20`} />
        <input name="last_played" type="date" className={input} />
        <button className={primary}>Thêm</button>
      </form>
    </Section>
  );
}
