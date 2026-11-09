import { requireAdmin } from "@/lib/auth";
import { getGames } from "@/lib/data";
import { DAY_NAMES } from "@/lib/schedule";
import { serverClient } from "@/lib/supabase/server";
import { addSlot, deleteSlot } from "../actions";
import { button, GameSelect, input, primary, Section } from "../ui";

export default async function AdminSchedule() {
  await requireAdmin();
  const supabase = await serverClient();
  const [{ data: slots }, games] = await Promise.all([
    supabase.from("schedule_slots").select("*").order("day_of_week").order("time_vn"),
    getGames(),
  ]);
  return (
    <div className="space-y-4">
      <Section title="Thêm khung giờ (giờ Việt Nam)">
        <form action={addSlot} className="flex flex-wrap items-center gap-2">
          <select name="day" className={input} defaultValue="1">
            {DAY_NAMES.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
          <input name="time" type="time" required defaultValue="20:00" className={input} />
          <input name="title" required placeholder="Tiêu đề" className={input} />
          <GameSelect games={games} empty="— game —" />
          <input name="note" placeholder="Ghi chú" className={input} />
          <button className={primary}>Thêm</button>
        </form>
      </Section>
      <Section title="Lịch tuần">
        <ul className="divide-y divide-border text-sm">
          {(slots ?? []).map((s) => (
            <li key={s.id as string} className="flex items-center gap-3 py-2">
              <span className="w-16">{DAY_NAMES[s.day_of_week as number]}</span>
              <span className="w-12 font-mono">{(s.time_vn as string).slice(0, 5)}</span>
              <span className="flex-1">
                {s.title as string} <span className="text-muted">{(s.game_slug as string) ?? ""} {(s.note as string) ?? ""}</span>
              </span>
              <form action={deleteSlot.bind(null, s.id as string)}>
                <button className={button}>Xóa</button>
              </form>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
