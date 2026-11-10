"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { createBucket, parseReactionPayload, pruneEvents, takeToken } from "../lib/reactions";
import type { BucketState, ReactionEvent, ReactionId } from "../lib/reactions";

// One ephemeral room per tab, shared by every component that shows it (card, badge).
// Supabase Realtime only: Presence counts the open tabs, Broadcast carries `{ id }`
// reactions. Nothing is stored, nobody signs in, and the presence key is a random
// per-tab id, so no name or user id ever leaves the browser.

export type TribeRoomStatus = "idle" | "demo" | "connecting" | "live" | "reconnecting" | "off";

export interface TribeRoomSnapshot {
  /** Distinct presence keys (open tabs) in the room; null in demo mode, before joining or when Realtime is unavailable. */
  online: number | null;
  status: TribeRoomStatus;
  /** Reactions seen in the last minute, oldest first (own taps included). */
  events: ReactionEvent[];
  /**
   * Whether this tab may broadcast. The channel is private (realtime.messages RLS,
   * migration 20261111090000): everyone listens and is counted, only signed-in fans
   * who are not banned can send reactions, so the anon key alone cannot flood it.
   */
  canSend: boolean;
}

const CHANNEL = "tribe-room";
const EVENT = "react";
/** Hidden this long → stop being counted until the tab is visible again. */
const HIDDEN_UNTRACK_MS = 60_000;
/** Keep the channel briefly after the last component unmounts (StrictMode, quick navigations). */
const LINGER_MS = 5_000;
/** Inbound reactions are flushed to React in small batches, not one render per emoji. */
const FLUSH_MS = 120;
/** Consecutive join failures before we give up showing a count (Realtime keeps retrying). */
const MAX_FAILURES = 3;

const SERVER_SNAPSHOT: TribeRoomSnapshot = { online: null, status: "idle", events: [], canSend: false };

let snap: TribeRoomSnapshot = { online: null, status: isSupabaseConfigured ? "idle" : "demo", events: [], canSend: false };
const listeners = new Set<() => void>();
const reactionListeners = new Set<(e: ReactionEvent) => void>();

let refs = 0;
let lingerTimer: ReturnType<typeof setTimeout> | undefined;
let hiddenTimer: ReturnType<typeof setTimeout> | undefined;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let channel: RealtimeChannel | null = null;
let removeChannel: ((c: RealtimeChannel) => unknown) | null = null;
let generation = 0;
let subscribed = false;
let tracked = false;
let failures = 0;
let seq = 0;
let bucket: BucketState | null = null;
let pending: ReactionEvent[] = [];
let presenceKey: string | null = null;

function set(patch: Partial<TribeRoomSnapshot>) {
  snap = { ...snap, ...patch };
  listeners.forEach((notify) => notify());
}

function randomKey(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function flush() {
  flushTimer = undefined;
  if (!pending.length) return;
  const batch = pending;
  pending = [];
  set({ events: pruneEvents([...snap.events, ...batch], Date.now()) });
  for (const e of batch) reactionListeners.forEach((fn) => safely(() => fn(e)));
}

function record(id: ReactionId, own: boolean) {
  const e: ReactionEvent = { seq: ++seq, id, at: Date.now(), own };
  pending.push(e);
  // Own taps flush right away so the press feels instant; inbound ones are batched.
  if (own) {
    if (flushTimer) clearTimeout(flushTimer);
    flush();
  } else flushTimer ??= setTimeout(flush, FLUSH_MS);
}

function safely(fn: () => unknown) {
  try {
    const r = fn();
    if (r && typeof (r as Promise<unknown>).catch === "function") (r as Promise<unknown>).catch(() => {});
  } catch {
    // Realtime problems must never break the page.
  }
}

function countPresence() {
  if (!channel) return;
  try {
    set({ online: Object.keys(channel.presenceState()).length });
  } catch {
    // keep the last count
  }
}

function track() {
  if (!channel || !subscribed || tracked || document.visibilityState === "hidden") return;
  tracked = true;
  safely(() => channel!.track({ t: Date.now() }));
}

function untrack() {
  if (!channel || !tracked) return;
  tracked = false;
  safely(() => channel!.untrack());
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    hiddenTimer ??= setTimeout(() => {
      hiddenTimer = undefined;
      untrack();
    }, HIDDEN_UNTRACK_MS);
  } else {
    if (hiddenTimer) clearTimeout(hiddenTimer);
    hiddenTimer = undefined;
    track();
  }
}

function connect() {
  const gen = ++generation;
  set({ status: "connecting" });
  presenceKey ??= randomKey();
  import("@/shared/lib/supabase-browser")
    .then(async ({ browserClient }) => {
      if (gen !== generation) return; // torn down while loading
      const client = browserClient();
      // A private channel is authorised with the caller's JWT: hand Realtime the session
      // token first (anon visitors join as `anon` and may listen + be counted only).
      const { data } = await client.auth.getSession().catch(() => ({ data: { session: null } }));
      if (gen !== generation) return;
      if (data.session) await client.realtime.setAuth(data.session.access_token);
      set({ canSend: Boolean(data.session) });
      client.auth.onAuthStateChange((_event, session) => set({ canSend: Boolean(session) }));
      removeChannel = (c) => client.removeChannel(c);
      const ch = client.channel(CHANNEL, { config: { private: true, presence: { key: presenceKey! }, broadcast: { self: false } } });
      channel = ch;
      ch.on("presence", { event: "sync" }, () => {
        if (channel === ch) countPresence();
      })
        .on("broadcast", { event: EVENT }, (message) => {
          if (channel !== ch) return;
          const id = parseReactionPayload(message?.payload);
          if (id) record(id, false);
        })
        .subscribe((state) => {
          if (channel !== ch) return;
          if (state === "SUBSCRIBED") {
            subscribed = true;
            failures = 0;
            tracked = false; // a (re)join starts with no presence of ours
            set({ status: "live" });
            track();
            countPresence();
          } else {
            subscribed = false;
            tracked = false;
            if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") failures++;
            // realtime-js rejoins on its own with backoff; we only reflect it.
            if (failures >= MAX_FAILURES) set({ status: "off", online: null });
            else set({ status: "reconnecting" });
          }
        });
      document.addEventListener("visibilitychange", onVisibility);
    })
    .catch(() => {
      if (gen === generation) set({ status: "off", online: null });
    });
}

function disconnect() {
  generation++;
  document.removeEventListener("visibilitychange", onVisibility);
  if (hiddenTimer) clearTimeout(hiddenTimer);
  hiddenTimer = undefined;
  const ch = channel;
  channel = null;
  subscribed = false;
  tracked = false;
  failures = 0;
  if (ch) safely(() => removeChannel?.(ch));
  set({ online: null, status: "idle" });
}

function start() {
  if (lingerTimer) {
    clearTimeout(lingerTimer);
    lingerTimer = undefined;
  }
  if (!isSupabaseConfigured || channel || snap.status === "connecting") return;
  // Load supabase-js once the browser is idle so the card never delays first paint.
  const go = () => {
    if (refs > 0 && !channel && snap.status !== "connecting") safely(connect);
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 3000 });
  else setTimeout(go, 1200);
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  refs++;
  safely(start);
  return () => {
    listeners.delete(notify);
    refs--;
    if (refs <= 0 && isSupabaseConfigured) {
      refs = 0;
      lingerTimer = setTimeout(() => {
        lingerTimer = undefined;
        if (refs === 0) safely(disconnect);
      }, LINGER_MS);
    }
  };
}

/**
 * Sends a reaction to everyone in the room (and floats it locally). Returns false
 * when the tap was rate-limited (burst of 5, then a short cooldown) or invalid.
 * Never throws; in demo mode or without Realtime the reaction is local only.
 */
export function sendReaction(id: ReactionId): boolean {
  const now = Date.now();
  bucket ??= createBucket(now);
  const r = takeToken(bucket, now);
  bucket = r.state;
  if (!r.ok) return false;
  record(id, true);
  const ch = channel;
  // Guests see their own tap float locally; only signed-in fans reach everyone (RLS refuses anon sends anyway).
  if (ch && subscribed && snap.canSend) safely(() => ch.send({ type: "broadcast", event: EVENT, payload: { id } }));
  return true;
}

const getSnapshot = () => snap;
const getServerSnapshot = () => SERVER_SNAPSHOT;
const getOnline = () => snap.online;
const getServerOnline = () => null;

/**
 * Joins the "tribe-room" channel (once per tab) while mounted. `onReaction` fires for
 * every reaction this tab sees, own taps included (the floating layer listens here).
 */
export function useTribeRoom(
  onReaction?: (e: ReactionEvent) => void,
): TribeRoomSnapshot & { send: (id: ReactionId) => boolean; lastReactions: ReactionEvent[] } {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const handler = useRef(onReaction);
  useEffect(() => {
    handler.current = onReaction;
  });
  useEffect(() => {
    const fn = (e: ReactionEvent) => handler.current?.(e);
    reactionListeners.add(fn);
    return () => {
      reactionListeners.delete(fn);
    };
  }, []);
  return { ...state, lastReactions: state.events, send: sendReaction };
}

/** Just the online count (re-renders only when it changes); for small badges. */
export function useTribeOnline(): number | null {
  return useSyncExternalStore(subscribe, getOnline, getServerOnline);
}
