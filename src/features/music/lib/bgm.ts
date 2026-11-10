// Background music ("Đài phát thanh Bộ Tộc") rules, kept pure so they can be tested.
// The radio tries to start as soon as the page loads; browsers that block audible
// autoplay until the visitor interacts (most of them, on a first visit) get it on the
// first tap/keypress instead — unless the visitor turned it off before (remembered per device).

export type BgmPref = "on" | "off" | null;

export const BGM_PREF_KEY = "gbt:bgm";
export const BGM_VOLUME_KEY = "gbt:bgm-volume";
/** Volume (0–1) when the music starts by itself: background, not a jump scare. */
export const BGM_DEFAULT_VOLUME = 0.3;
/** Fired by other players (e.g. "Nghe trực tiếp" on /nhac) so two songs never overlap. */
export const BGM_PAUSE_EVENT = "gbt:bgm-pause";

export function parseBgmPref(raw: string | null | undefined): BgmPref {
  return raw === "on" || raw === "off" ? raw : null;
}

/** Stored volume, clamped to 0–1; falls back to the default for anything odd. */
export function parseVolume(raw: string | null | undefined): number {
  const v = raw == null || raw === "" ? NaN : Number(raw);
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : BGM_DEFAULT_VOLUME;
}

// Invite links carry a one-time token, admin is a work screen, and /gui-anh-do is read
// aloud on stream (its own copy promises no sound): the radio never starts there.
const QUIET_PREFIXES = ["/admin", "/moi", "/gui-anh-do"];

export function isQuietPath(pathname: string): boolean {
  return QUIET_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Should the radio start now (on load, or on the first interaction)? */
export function shouldAutoStart({ pref, pathname, alreadyActive }: { pref: BgmPref; pathname: string; alreadyActive: boolean }): boolean {
  return !alreadyActive && pref !== "off" && !isQuietPath(pathname);
}
