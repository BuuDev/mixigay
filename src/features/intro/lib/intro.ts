import { vnDate } from "@/features/schedule/lib/calendar";

/** localStorage key: the ritual shows once per device per Vietnam calendar day (spec §1). */
export function introKey(now: Date): string {
  const { y, m, d } = vnDate(now);
  return `td.intro.${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Storage may be missing or throw (private mode, blocked site data): then show it. */
export function seenToday(storage: Pick<Storage, "getItem"> | undefined, now: Date): boolean {
  try {
    return storage?.getItem(introKey(now)) === "1";
  } catch {
    return false;
  }
}

export function markSeen(storage: Pick<Storage, "setItem"> | undefined, now: Date): void {
  try {
    storage?.setItem(introKey(now), "1");
  } catch {
    // Not remembering is fine: the ritual just shows again.
  }
}
