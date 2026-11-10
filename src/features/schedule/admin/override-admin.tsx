import { connection } from "next/server";
import { button, input, primary, Section } from "@/features/admin/ui";
import { upcomingOverrides, vnDateKey } from "../lib/overrides";
import { DAY_NAMES } from "../lib/schedule";
import { getScheduleOverrides } from "../server/queries";
import type { ScheduleOverride } from "../types";
import { deleteOverride, saveOverride } from "./actions";

const weekday = (dateVn: string) => DAY_NAMES[new Date(`${dateVn}T00:00:00Z`).getUTCDay()];

/** Fields shared by the add and edit forms; `o` pre-fills an existing exception. */
function Fields({ o }: { o?: ScheduleOverride }) {
  return (
    <>
      <label className="flex items-center gap-1">
        <input name="cancelled" type="checkbox" defaultChecked={o?.cancelled ?? false} />
        Nghỉ
      </label>
      <label>
        <span className="sr-only">Giờ (giờ Việt Nam)</span>
        <input name="time" type="time" defaultValue={o?.time} className={input} />
      </label>
      <label>
        <span className="sr-only">Tiêu đề</span>
        <input name="title" placeholder="Tiêu đề (bỏ trống = giữ nguyên)" defaultValue={o?.title} maxLength={120} className={input} />
      </label>
      <label>
        <span className="sr-only">Ghi chú</span>
        <input name="note" placeholder="Ghi chú hiển thị cho fan" defaultValue={o?.note} maxLength={200} className={input} />
      </label>
    </>
  );
}

/**
 * One-day exceptions (schedule_overrides): a day off, a moved time or title, or an
 * extra stream on a day without a weekly slot (needs a time). Lists today onward.
 */
export async function OverrideAdmin() {
  const all = await getScheduleOverrides();
  await connection(); // "today" must be read at request time, never prerendered
  const now = new Date();
  const upcoming = upcomingOverrides(all, now);
  return (
    <Section title="Ngoại lệ theo ngày (giờ Việt Nam)">
      <p className="text-sm text-muted">
        Tick “Nghỉ” để hủy buổi stream ngày đó. Nhập giờ và/hoặc tiêu đề để đổi buổi của ngày đó, hoặc thêm một buổi vào ngày vốn không có lịch (cần giờ).
      </p>
      <form action={saveOverride} className="flex flex-wrap items-center gap-2 text-sm">
        <label>
          <span className="sr-only">Ngày</span>
          <input name="date" type="date" required min={vnDateKey(now)} className={input} />
        </label>
        <Fields />
        <button className={primary}>Thêm</button>
      </form>
      {upcoming.length ? (
        <ul className="divide-y divide-border">
          {upcoming.map((o) => (
            <li key={o.dateVn}>
              <form action={saveOverride} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <input type="hidden" name="date" value={o.dateVn} />
                <span className="w-36 font-mono">
                  {o.dateVn} <span className="font-sans text-muted">{weekday(o.dateVn)}</span>
                </span>
                <Fields o={o} />
                <button className={primary}>Lưu</button>
                <button formAction={deleteOverride.bind(null, o.dateVn)} className={button}>
                  Xóa
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Chưa có ngoại lệ nào sắp tới.</p>
      )}
    </Section>
  );
}
