"use client";

import { useMemo, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { setAttendance } from "../actions";
import { appendGuestHistory, markGuestAttended, parseGuestHistory, readGuestDay, readGuestHistoryRaw, safeStorage } from "../lib/guest-storage";
import { withToday } from "../lib/streak";
import { shownCount } from "../lib/tonight";
import type { AttendanceSnapshot } from "../types";

// Guest taps live in localStorage; other tabs report changes via "storage", this tab via `listeners`.
const listeners = new Set<() => void>();
function subscribeGuest(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
const guestSnapshot = () => readGuestDay(safeStorage());
const noGuestOnServer = () => null;
const guestHistorySnapshot = () => readGuestHistoryRaw(safeStorage());
const noHistoryOnServer = () => "";

/**
 * Today's RSVP for the viewer. Signed in: optimistic toggle through the
 * setAttendance action (tap again to un-tap). Guest: one tap per device per
 * Vietnam day, kept only in this browser and never counted. `dates` are the
 * viewer's own attendance days (server history or this device's guest history).
 * `today` is the viewer's Vietnam day key (null until the clock is known).
 */
export function useAttendance(snapshot: AttendanceSnapshot, today: string | null) {
  // The first server render is the baseline: later refreshes may carry a stale
  // cached count (revalidateTag "max"), so the count is derived from it plus our own tap.
  const [baseline] = useState(snapshot);
  const [attended, setAttended] = useState(snapshot.attended);
  const [optimistic, setOptimistic] = useOptimistic(attended);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string>();
  const guestDay = useSyncExternalStore(subscribeGuest, guestSnapshot, noGuestOnServer);
  const guestHistoryRaw = useSyncExternalStore(subscribeGuest, guestHistorySnapshot, noHistoryOnServer);
  // Fallback for the session when storage refuses to save.
  const [sessionDay, setSessionDay] = useState<string | null>(null);

  const signedIn = baseline.signedIn;
  const guestDone = today !== null && (guestDay === today || sessionDay === today);
  const isAttending = signedIn ? optimistic : guestDone;
  const count = signedIn ? shownCount(baseline.count, baseline.attended, optimistic) : baseline.count;
  // The viewer's own days for the personal streak, today included when tapped (optimistically).
  const dates = useMemo(() => {
    const past = signedIn ? baseline.history : parseGuestHistory(guestHistoryRaw, guestDay);
    return today ? withToday(past, today, isAttending) : past;
  }, [signedIn, baseline.history, guestHistoryRaw, guestDay, today, isAttending]);

  /** Returns true when the tap turned the RSVP on (for celebratory feedback). */
  function tap(): boolean {
    setNotice(undefined);
    if (!signedIn) {
      if (!today || guestDone) return false;
      const storage = safeStorage();
      const saved = markGuestAttended(storage, today);
      appendGuestHistory(storage, today);
      if (saved) listeners.forEach((l) => l());
      else setSessionDay(today);
      return true;
    }
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      const res = await setAttendance(next);
      if (res.ok) startTransition(() => setAttended(next));
      else setNotice(res.message);
    });
    return next;
  }

  return { attended: isAttending, count, signedIn, pending, notice, tap, dates };
}
