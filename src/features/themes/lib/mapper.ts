import { THEMES, type Theme, type ThemeWindow } from "../types";

export interface ThemeScheduleRow {
  id: string;
  theme: string;
  label: string;
  starts_on: string;
  ends_on: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isTheme = (t: string): t is Theme => (THEMES as readonly string[]).includes(t);

/** Row → domain; null for a row the CSS cannot render (unknown theme, bad dates), so one bad row never breaks the shared cache. */
export function mapThemeWindow(r: ThemeScheduleRow): ThemeWindow | null {
  if (!isTheme(r.theme) || !DATE.test(r.starts_on) || !DATE.test(r.ends_on) || r.ends_on < r.starts_on) return null;
  return { id: r.id, theme: r.theme, label: r.label, startsOn: r.starts_on, endsOn: r.ends_on };
}
