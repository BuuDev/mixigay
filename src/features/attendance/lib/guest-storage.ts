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

// ===== Guest history (for the personal streak) and badges already celebrated =====

export const GUEST_HISTORY_KEY = "gbt:attendance-history";
export const SEEN_BADGES_KEY = "gbt:streak-badges-seen";
/** Enough for years of nights and for the 100-night badge; older days drop off first. */
const MAX_HISTORY = 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readJsonStrings(storage: ReadStorage | null, key: string): string[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Raw history value, for useSyncExternalStore (a string, so it is a stable snapshot). */
export function readGuestHistoryRaw(storage: ReadStorage | null): string {
  if (!storage) return "";
  try {
    return storage.getItem(GUEST_HISTORY_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Every Vietnam day this device tapped on as a guest (the last single-day tap included), oldest first. */
export function readGuestHistory(storage: ReadStorage | null): string[] {
  const days = new Set(readJsonStrings(storage, GUEST_HISTORY_KEY).filter((d) => DATE_RE.test(d)));
  const last = readGuestDay(storage);
  if (last) days.add(last);
  return [...days].sort();
}

/** Parses a raw history value (see readGuestHistoryRaw) plus the last tapped day. */
export function parseGuestHistory(raw: string, lastDay: string | null): string[] {
  return readGuestHistory({ getItem: (k) => (k === GUEST_HISTORY_KEY ? raw || null : k === GUEST_KEY ? lastDay : null) });
}

/** Adds `dateVn` to the guest's history; false when it could not be stored. */
export function appendGuestHistory(storage: (ReadStorage & WriteStorage) | null, dateVn: string): boolean {
  if (!storage || !DATE_RE.test(dateVn)) return false;
  const days = readGuestHistory(storage).filter((d) => d !== dateVn);
  days.push(dateVn);
  days.sort();
  try {
    storage.setItem(GUEST_HISTORY_KEY, JSON.stringify(days.slice(-MAX_HISTORY)));
    return true;
  } catch {
    return false;
  }
}

/** Badge ids already celebrated on this device. */
export function readSeenBadges(storage: ReadStorage | null): string[] {
  return readJsonStrings(storage, SEEN_BADGES_KEY);
}

/** Remembers that these badges were celebrated here, so each bursts once per device. */
export function markBadgesSeen(storage: (ReadStorage & WriteStorage) | null, ids: readonly string[]): boolean {
  if (!storage) return false;
  const seen = new Set(readSeenBadges(storage));
  ids.forEach((id) => seen.add(id));
  try {
    storage.setItem(SEEN_BADGES_KEY, JSON.stringify([...seen]));
    return true;
  } catch {
    return false;
  }
}
