/** Seasonal skins: each matches an `html[data-theme="…"]` block in src/shared/design/themes.generated.css. */
export const THEMES = ["tet", "birthday", "mixi-cup"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  tet: "Tết",
  birthday: "Sinh nhật anh Độ",
  "mixi-cup": "Mixi Cup",
};

/** One row of theme_schedule: the skin is on for every Vietnam day from startsOn to endsOn, both inclusive. */
export interface ThemeWindow {
  id: string;
  theme: Theme;
  label: string;
  /** "YYYY-MM-DD", Vietnam calendar day */
  startsOn: string;
  /** "YYYY-MM-DD", Vietnam calendar day, inclusive */
  endsOn: string;
}
