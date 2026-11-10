import { button, input, primary, Section } from "@/features/admin/ui";
import { getThemeSchedule } from "../server/queries";
import { THEME_LABELS, THEMES } from "../types";
import { addThemeWindow, deleteThemeWindow } from "./actions";
import { SkinPreview } from "./skin-preview";

/** theme_schedule: which seasonal skin is on, by Vietnam date (both ends inclusive). */
export async function SkinAdmin() {
  const windows = await getThemeSchedule();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Skin theo dịp – lịch bật</h1>
      <p className="max-w-prose text-sm text-muted">
        Skin chỉ đổi màu, bật theo ngày giờ Việt Nam của người xem, gồm cả ngày bật và ngày tắt. Hai khoảng chồng nhau thì khoảng bắt đầu sau được ưu tiên.
      </p>
      <Section title="Xem thử (chỉ trên trang này)">
        <SkinPreview />
      </Section>
      <Section title="Thêm lịch bật skin">
        <form action={addThemeWindow} className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col gap-1">
            Skin
            <select name="theme" required className={input} defaultValue={THEMES[0]}>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {THEME_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Tên dịp
            <input name="label" required minLength={2} maxLength={80} placeholder="Tết Đinh Mùi 2027" className={input} />
          </label>
          <label className="flex flex-col gap-1">
            Ngày bật
            <input name="starts" type="date" required className={input} />
          </label>
          <label className="flex flex-col gap-1">
            Ngày tắt (vẫn bật hết ngày này)
            <input name="ends" type="date" required className={input} />
          </label>
          <button className={primary}>Thêm</button>
        </form>
      </Section>
      <Section title="Lịch đã đặt">
        {windows.length ? (
          <ul className="divide-y divide-border text-sm">
            {windows.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="w-32 font-semibold">{THEME_LABELS[w.theme]}</span>
                <span className="flex-1">{w.label}</span>
                <span className="font-mono text-muted">
                  {w.startsOn} – {w.endsOn}
                </span>
                <form action={deleteThemeWindow.bind(null, w.id)}>
                  <button className={button}>
                    Xóa<span className="sr-only"> lịch {w.label}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Chưa có lịch nào: trang đang dùng giao diện mặc định.</p>
        )}
      </Section>
    </div>
  );
}
