import { createHmac, timingSafeEqual } from "node:crypto";

// Pure helpers for YouTube WebSub (PubSubHubbub). See docs/04-integrations.md, "WebSub".
// No XML library: the hub sends a small Atom document with a fixed shape, so a few
// anchored regexes are enough, and every id is validated before use.

export const WEBSUB_HUB = "https://pubsubhubbub.appspot.com/subscribe";
export const WEBSUB_LEASE_SECONDS = 864_000;
/** Bodies above this are refused before verification (a notification is a few KB). */
export const WEBSUB_MAX_BODY_BYTES = 256 * 1024;
/** One videos.list call takes at most 50 ids, so a notification never costs more than 1 unit. */
export const WEBSUB_MAX_IDS = 50;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_CHALLENGE = 200;

export function topicUrl(channelId: string): string {
  return `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
}

/**
 * Checks `X-Hub-Signature: sha1=<hex>` (or `sha256=<hex>`) as HMAC of the raw body with
 * the subscription secret. Compares in constant time; anything missing or malformed is false.
 */
export function verifySignature(rawBody: string | Buffer, header: string | null, secret: string): boolean {
  if (!secret || !header) return false;
  const m = /^(sha1|sha256)=([0-9a-fA-F]+)$/.exec(header.trim());
  if (!m) return false;
  const [, algo, hex] = m;
  if (hex.length !== (algo === "sha1" ? 40 : 64)) return false;
  const expected = createHmac(algo, secret).update(rawBody).digest();
  const given = Buffer.from(hex, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export interface WebSubFeed {
  /** New or updated videos of the expected channel. */
  videoIds: string[];
  /** Videos the channel deleted or made private. */
  deleted: string[];
}

function tag(xml: string, name: string): string | undefined {
  const re = new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`);
  return re.exec(xml)?.[1];
}

/** Video ids from a hub notification, limited to `channelId`, deduplicated and capped. */
export function parseFeed(xml: string, channelId: string): WebSubFeed {
  const videoIds = new Set<string>();
  const deleted = new Set<string>();
  if (typeof xml !== "string" || !xml) return { videoIds: [], deleted: [] };

  for (const [, entry] of xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)) {
    const id = tag(entry, "yt:videoId");
    const owner = tag(entry, "yt:channelId");
    if (!id || !VIDEO_ID.test(id)) continue;
    if (owner !== channelId) continue;
    videoIds.add(id);
  }

  // <at:deleted-entry ref="yt:video:ID" when="…"> … <at:by><uri>…/channel/UC…</uri></at:by></at:deleted-entry>
  // The element may also be self-closing.
  for (const m of xml.matchAll(/<at:deleted-entry\b([^>]*?)(?:\/>|>([\s\S]*?)<\/at:deleted-entry>)/g)) {
    const ref = /\bref=["']yt:video:([^"']+)["']/.exec(m[1])?.[1];
    if (!ref || !VIDEO_ID.test(ref)) continue;
    const owner = /\/channel\/([A-Za-z0-9_-]+)/.exec(m[2] ?? "")?.[1];
    if (owner && owner !== channelId) continue;
    deleted.add(ref);
  }

  return { videoIds: [...videoIds].slice(0, WEBSUB_MAX_IDS), deleted: [...deleted].slice(0, WEBSUB_MAX_IDS) };
}

/** The hub's verification GET: returns the challenge to echo, or null when the request is not ours. */
export function verifyChallenge(params: URLSearchParams, expectedTopic: string): string | null {
  const mode = params.get("hub.mode");
  const topic = params.get("hub.topic");
  const challenge = params.get("hub.challenge");
  if (mode !== "subscribe" && mode !== "unsubscribe") return null;
  if (topic !== expectedTopic) return null;
  if (!challenge || challenge.length > MAX_CHALLENGE) return null;
  return challenge;
}

/** The hub must be able to reach the callback, so local URLs are never registered. */
export function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "0.0.0.0" || host === "::1" || host === "[::1]" || host.startsWith("127.") || host.endsWith(".localhost");
  } catch {
    return true;
  }
}

/** Form body for the hub's /subscribe endpoint. */
export function subscribeForm(opts: { channelId: string; callback: string; secret: string }): URLSearchParams {
  return new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.topic": topicUrl(opts.channelId),
    "hub.callback": opts.callback,
    "hub.secret": opts.secret,
    "hub.lease_seconds": String(WEBSUB_LEASE_SECONDS),
    "hub.verify": "async",
  });
}
