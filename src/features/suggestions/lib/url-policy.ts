// Links fans may attach to a game suggestion: stores and video sites only, so a
// suggestion can never point at a gambling page or a file host. The database adds the
// host-independent rules (https, ≤ 500 chars, no user@host, no punycode, no shorteners)
// in supabase/migrations/20261110090000_moderation.sql.

const HOSTS = [
  "store.steampowered.com",
  "steamcommunity.com",
  "itch.io",
  "store.epicgames.com",
  "gog.com",
  "gamejolt.com",
  "roblox.com",
  "play.google.com",
  "apps.apple.com",
  "nintendo.com",
  "store.playstation.com",
  "xbox.com",
  "youtube.com",
  "youtu.be",
] as const;

/** Sites whose subdomains are per-creator pages (e.g. "dev.itch.io"). */
const SUBDOMAIN_HOSTS = ["itch.io"];

export const ALLOWED_SUGGESTION_HOSTS_LABEL = "Steam, itch.io, Epic, GOG, Game Jolt, Roblox, Google Play, App Store, Nintendo, PlayStation, Xbox, YouTube";

/** The normalized https URL when it points at an allowed store or video site, else null. */
export function allowedSuggestionUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value || value.length > 500) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  if (host.startsWith("xn--") || host.includes(".xn--")) return null;
  const ok = HOSTS.some((h) => host === h) || SUBDOMAIN_HOSTS.some((h) => host.endsWith(`.${h}`));
  return ok ? url.toString() : null;
}
