// Guests (not signed in) may tap "có mặt" once per device per Vietnam day. The tap
// lives only in this browser's localStorage and is never sent to or counted by the
// server (.claude/skills/fan-content/SKILL.md, rule 3). Storage can be missing or
// throw (private mode, blocked cookies, quota), so every access is guarded.

export const GUEST_KEY = "gbt:attendance";

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "setItem">;

/** window.localStorage, or null when unavailable (server, disabled, SecurityError). */
export function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The Vietnam day the guest last tapped on, or null. */
export function readGuestDay(storage: ReadStorage | null): string | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(GUEST_KEY);
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** True when the guest already tapped on `dateVn`. */
export function guestAttended(storage: ReadStorage | null, dateVn: string): boolean {
  return readGuestDay(storage) === dateVn;
}

/** Remembers the guest's tap for `dateVn`; false when it could not be stored. */
export function markGuestAttended(storage: WriteStorage | null, dateVn: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(GUEST_KEY, dateVn);
    return true;
  } catch {
    return false;
  }
}
