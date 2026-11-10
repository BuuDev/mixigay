// Background radio playlist: long, chill instrumentals by Kevin MacLeod (incompetech.com),
// licensed under Creative Commons Attribution 4.0. The licence only asks for credit,
// which the player and /gioi-thieu show. Files are 48 kbps HE-AAC in public/music
// (encoded from the original MP3s with macOS `afconvert -d aach -b 48000`).

export interface BgmTrack {
  slug: string;
  title: string;
  /** Seconds, for the "~43 phút" label. */
  duration: number;
}

export const BGM_ARTIST = "Kevin MacLeod";
export const BGM_LICENSE = { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" };
export const BGM_SOURCE_URL = "https://incompetech.com";

export const BGM_TRACKS: BgmTrack[] = [
  { slug: "airport-lounge", title: "Airport Lounge", duration: 308 },
  { slug: "backbay-lounge", title: "Backbay Lounge", duration: 267 },
  { slug: "bossa-antigua", title: "Bossa Antigua", duration: 283 },
  { slug: "cool-vibes", title: "Cool Vibes", duration: 218 },
  { slug: "lobby-time", title: "Lobby Time", duration: 193 },
  { slug: "wholesome", title: "Wholesome", duration: 364 },
  { slug: "dreamer", title: "Dreamer", duration: 204 },
  { slug: "vibing-over-venus", title: "Vibing Over Venus", duration: 411 },
  { slug: "local-forecast-elevator", title: "Local Forecast – Elevator", duration: 189 },
  { slug: "easy-lemon", title: "Easy Lemon", duration: 126 },
];

export function trackSrc(t: BgmTrack): string {
  return `/music/${t.slug}.m4a`;
}

/** Total playlist length in whole minutes. */
export function playlistMinutes(tracks: BgmTrack[] = BGM_TRACKS): number {
  return Math.round(tracks.reduce((s, t) => s + t.duration, 0) / 60);
}

/** Next index, wrapping around so the playlist loops forever. */
export function nextIndex(i: number, length = BGM_TRACKS.length): number {
  return length ? (i + 1) % length : 0;
}
