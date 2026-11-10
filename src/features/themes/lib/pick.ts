import { vnDateKey } from "@/features/schedule/lib/overrides";
import type { Theme, ThemeWindow } from "../types";

/**
 * The skin that is on for a Vietnam calendar day ("YYYY-MM-DD"), or null.
 * Both ends are inclusive. When windows overlap, the one that started latest wins
 * (a short event inside a long season); ties go to the one ending first, then id,
 * so every viewer sees the same skin.
 */
export function activeThemeOn(windows: readonly ThemeWindow[], dayVn: string): Theme | null {
  let best: ThemeWindow | null = null;
  for (const w of windows) {
    if (w.startsOn > dayVn || w.endsOn < dayVn) continue;
    if (!best || w.startsOn > best.startsOn || (w.startsOn === best.startsOn && (w.endsOn < best.endsOn || (w.endsOn === best.endsOn && w.id < best.id))))
      best = w;
  }
  return best?.theme ?? null;
}

/** The skin that is on at an instant, judged by the Vietnam date (UTC+7) of that instant. */
export function activeThemeAt(windows: readonly ThemeWindow[], at: Date): Theme | null {
  return activeThemeOn(windows, vnDateKey(at));
}
