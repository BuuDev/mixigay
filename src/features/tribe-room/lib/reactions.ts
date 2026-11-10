// Pure logic for the "Bộ Tộc đang ở đây" room: the fixed reaction set, payload
// validation, the own-send rate limiter, the inbound render cap and the per-window
// tallies behind the counters and the combo badge. No DOM, no clock: callers pass `now`.

export const REACTIONS = [
  { id: "fire", emoji: "🔥", label: "Cháy" },
  { id: "heart", emoji: "❤️", label: "Thương" },
  { id: "laugh", emoji: "😂", label: "Cười" },
  { id: "salute", emoji: "🫡", label: "Chào Tộc Trưởng" },
] as const;

export type Reaction = (typeof REACTIONS)[number];
export type ReactionId = Reaction["id"];

const BY_ID = new Map<string, Reaction>(REACTIONS.map((r) => [r.id, r]));

export function isReactionId(x: unknown): x is ReactionId {
  return typeof x === "string" && BY_ID.has(x);
}

export function reactionOf(id: ReactionId): Reaction {
  return BY_ID.get(id)!;
}

/**
 * Broadcast payloads come from anyone holding the anon key, so the only thing we
 * accept is `{ id }` with a known id. Anything else (free text, extra fields used as
 * the id, numbers) is dropped: no user-written text ever renders.
 */
export function parseReactionPayload(payload: unknown): ReactionId | null {
  if (typeof payload !== "object" || payload === null) return null;
  const id = (payload as { id?: unknown }).id;
  return isReactionId(id) ? id : null;
}

// ---------------------------------------------------------------- rate limiter

export interface BucketConfig {
  /** Maximum taps in a burst. */
  capacity: number;
  /** One token comes back every `refillMs`. */
  refillMs: number;
  /** After the bucket runs dry, nothing is sent for this long. */
  cooldownMs: number;
}

export const SEND_LIMIT: BucketConfig = { capacity: 5, refillMs: 350, cooldownMs: 1500 };

export interface BucketState {
  tokens: number;
  /** Time the tokens were last brought up to date. */
  at: number;
  /** No sends before this time (0 = not cooling down). */
  coolUntil: number;
}

export function createBucket(now: number, cfg: BucketConfig = SEND_LIMIT): BucketState {
  return { tokens: cfg.capacity, at: now, coolUntil: 0 };
}

/** Token bucket: returns whether this tap may be sent and the next state. */
export function takeToken(state: BucketState, now: number, cfg: BucketConfig = SEND_LIMIT): { ok: boolean; state: BucketState } {
  // A clock that went backwards (tab restore, manual change) restarts the bucket.
  const elapsed = Math.max(0, now - state.at);
  const refilled = Math.min(cfg.capacity, state.tokens + elapsed / cfg.refillMs);
  const base = { tokens: refilled, at: now, coolUntil: state.coolUntil };
  if (now < state.coolUntil) return { ok: false, state: base };
  if (refilled < 1) return { ok: false, state: base };
  const tokens = refilled - 1;
  return { ok: true, state: { tokens, at: now, coolUntil: tokens < 1 ? now + cfg.cooldownMs : 0 } };
}

/** Milliseconds left in the cooldown, 0 when a tap would go through the cooldown check. */
export function cooldownLeft(state: BucketState, now: number): number {
  return Math.max(0, state.coolUntil - now);
}

// ---------------------------------------------------------------- events, cap, tallies

export interface ReactionEvent {
  /** Monotonic per tab, used as React key. */
  seq: number;
  id: ReactionId;
  /** Epoch ms when this tab saw it. */
  at: number;
  /** Sent by this tab. */
  own: boolean;
}

/** Most floating emojis on screen at once; extras are dropped (counters still count them). */
export const MAX_FLOATERS = 40;
/** Window for the "last minute" counters. */
export const COUNTER_WINDOW_MS = 60_000;
/** Window for the combo badge. */
export const COMBO_WINDOW_MS = 1_000;
/** Same reaction this many times inside the combo window shows "🔥 ×12". */
export const COMBO_MIN = 5;
/** Hard ceiling on remembered events, whatever the clock says. */
export const MAX_EVENTS = 2_000;

/** Whether one more floater may be added when `onScreen` are already showing. */
export function canFloat(onScreen: number, cap = MAX_FLOATERS): boolean {
  return onScreen < cap;
}

/** Keeps only the newest `cap` items (input is oldest first). */
export function capNewest<T>(items: readonly T[], cap = MAX_FLOATERS): T[] {
  return items.length <= cap ? items.slice() : items.slice(items.length - cap);
}

/** Drops events older than `windowMs` and keeps at most `max` (input is oldest first). */
export function pruneEvents(events: readonly ReactionEvent[], now: number, windowMs = COUNTER_WINDOW_MS, max = MAX_EVENTS): ReactionEvent[] {
  const from = now - windowMs;
  let i = 0;
  while (i < events.length && events[i].at <= from) i++;
  return capNewest(events.slice(i), max);
}

export type Tally = Record<ReactionId, number>;

export function emptyTally(): Tally {
  return { fire: 0, heart: 0, laugh: 0, salute: 0 };
}

/** Count per reaction for events inside (now - windowMs, now]. */
export function tally(events: readonly ReactionEvent[], now: number, windowMs: number): Tally {
  const out = emptyTally();
  const from = now - windowMs;
  for (const e of events) if (e.at > from && e.at <= now) out[e.id]++;
  return out;
}

/** The busiest reaction of the last second if it reached the combo threshold. */
export function combo(events: readonly ReactionEvent[], now: number, windowMs = COMBO_WINDOW_MS, min = COMBO_MIN): { id: ReactionId; count: number } | null {
  const t = tally(events, now, windowMs);
  let best: { id: ReactionId; count: number } | null = null;
  for (const r of REACTIONS) if (t[r.id] >= min && (!best || t[r.id] > best.count)) best = { id: r.id, count: t[r.id] };
  return best;
}

export function comboLabel(c: { id: ReactionId; count: number }): string {
  return `${reactionOf(c.id).emoji} ×${c.count}`;
}

// ---------------------------------------------------------------- floating path

export interface FloatPath {
  /** Start position across the layer, percent of width. */
  x: number;
  /** Sideways drift at mid-flight and at the end, px (gentle S curve). */
  driftMid: number;
  driftEnd: number;
  /** Final rotation, degrees. */
  rotate: number;
  /** Peak scale. */
  scale: number;
  /** Seconds. */
  duration: number;
}

/**
 * Random flight for one floater. Call only in event handlers / effects on the client
 * (never during render), so server and client markup always match.
 */
export function floatPath(rand: () => number = Math.random): FloatPath {
  const r = () => Math.min(0.999999, Math.max(0, rand()));
  const dir = r() < 0.5 ? -1 : 1;
  return {
    x: Math.round(12 + r() * 76),
    driftMid: Math.round(dir * (8 + r() * 22)),
    driftEnd: Math.round(-dir * (4 + r() * 18)),
    rotate: Math.round((r() * 2 - 1) * 24),
    scale: Math.round((1 + r() * 0.5) * 100) / 100,
    duration: Math.round((1.8 + r() * 0.9) * 100) / 100,
  };
}

// ---------------------------------------------------------------- announcements

/** Screen readers hear a summary at most this often. */
export const ANNOUNCE_EVERY_MS = 10_000;

export function shouldAnnounce(lastAt: number | null, now: number, every = ANNOUNCE_EVERY_MS): boolean {
  return lastAt === null || now - lastAt >= every;
}

export function announcement(online: number | null, minute: Tally): string {
  const parts = REACTIONS.filter((r) => minute[r.id] > 0).map((r) => `${minute[r.id]} ${r.label}`);
  const who = online === null ? "" : `${online} người Bộ Tộc đang ở đây. `;
  return parts.length ? `${who}Một phút qua: ${parts.join(", ")}.` : who.trim();
}
