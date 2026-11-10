import { youtubeUrl } from "@/shared/lib/links";
import { QUOTE_MAX_SECONDS } from "./limits";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function isVideoId(s: string): boolean {
  return VIDEO_ID.test(s);
}

function bounded(n: number): number | null {
  return Number.isSafeInteger(n) && n >= 0 && n <= QUOTE_MAX_SECONDS ? n : null;
}

/** YouTube's `t=` value: "125", "125s", "2m", "1h2m3s" → seconds, or null when malformed / out of range. */
export function parseTimeParam(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (/^\d{1,6}$/.test(s)) return bounded(Number(s));
  const m = /^(?:(\d{1,2})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s)?$/.exec(s);
  if (!s || !m || (!m[1] && !m[2] && !m[3])) return null;
  return bounded(Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0));
}

/** A typed time: "12:34", "1:02:03", "125" (seconds) or "1h2m3s" → seconds, or null. */
export function parseClock(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (!s.includes(":")) return parseTimeParam(s);
  const parts = s.split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d{1,4}$/.test(p))) return null;
  const nums = parts.map(Number);
  const sec = nums[nums.length - 1];
  if (sec >= 60 || parts[parts.length - 1].length !== 2) return null;
  if (nums.length === 3) {
    const [h, m] = nums;
    if (m >= 60 || parts[1].length !== 2) return null;
    return bounded(h * 3600 + m * 60 + sec);
  }
  return bounded(nums[0] * 60 + sec);
}

/** "02:05" under an hour, "1:02:03" from an hour on. */
export function formatClock(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Link to the exact moment on YouTube (always with `t`, even at 0s). */
export function quoteMomentUrl(videoId: string, atSeconds: number): string {
  return `${youtubeUrl(videoId)}&t=${Math.floor(atSeconds)}s`;
}

export interface ParsedLink {
  videoId: string;
  /** From `t=` / `start=` / `#t=`; null when absent or malformed. */
  seconds: number | null;
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

/** Video id + timestamp from a pasted YouTube link (watch, youtu.be, live, shorts, embed), or null. */
export function parseYouTubeLink(raw: string): ParsedLink | null {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (host === "youtu.be") id = path[0] ?? null;
  else if (YOUTUBE_HOSTS.has(host)) {
    if (path[0] === "watch") id = url.searchParams.get("v");
    else if (["live", "shorts", "embed", "v"].includes(path[0] ?? "")) id = path[1] ?? null;
  }
  if (!id || !isVideoId(id)) return null;
  const hashT = new URLSearchParams(url.hash.replace(/^#/, "")).get("t");
  const t = url.searchParams.get("t") ?? url.searchParams.get("start") ?? hashT;
  return { videoId: id, seconds: t === null ? null : parseTimeParam(t) };
}

export type Moment = { ok: true; videoId: string; atSeconds: number } | { ok: false; message: string };

/**
 * The (video, second) a fan points at. A pasted link wins over the picked video;
 * a typed time wins over the link's `t=` (it is the more deliberate input).
 * `maxSeconds` (video length, when known) rejects moments past the end.
 */
export function resolveMoment(input: { videoId?: string; link?: string; time?: string }, maxSeconds?: (videoId: string) => number | undefined): Moment {
  const link = input.link?.trim() ?? "";
  const time = input.time?.trim() ?? "";
  let videoId: string;
  let linkSeconds: number | null = null;
  if (link) {
    const parsed = parseYouTubeLink(link);
    if (!parsed) return { ok: false, message: "Link chưa đúng: dán link video YouTube, VD https://youtu.be/xxxxxxxxxxx?t=125." };
    videoId = parsed.videoId;
    linkSeconds = parsed.seconds;
  } else {
    videoId = input.videoId?.trim() ?? "";
    if (!isVideoId(videoId)) return { ok: false, message: "Chọn một video hoặc dán link YouTube có mốc thời gian." };
  }
  let atSeconds: number | null = linkSeconds;
  if (time) {
    atSeconds = parseClock(time);
    if (atSeconds === null) return { ok: false, message: "Mốc thời gian viết dạng phút:giây, VD 12:34 hoặc 1:02:03." };
  }
  if (atSeconds === null) return { ok: false, message: "Nhập mốc thời gian (VD 12:34) hoặc dán link có ?t=." };
  const max = maxSeconds?.(videoId);
  if (max !== undefined && atSeconds > max) return { ok: false, message: `Video này chỉ dài ${formatClock(max)}, mốc thời gian vượt quá rồi.` };
  return { ok: true, videoId, atSeconds };
}
