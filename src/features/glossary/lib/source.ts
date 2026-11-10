import { SOURCE_MAX } from "./limits";

// Source policy for fan glossary entries: every claim about the channel or a real
// person must point to the channel's own videos/page or an established Vietnamese
// news site. The DB only checks "https:// and ≤ 300 chars"; this list is the app rule.

const YOUTUBE_HOSTS = ["youtube.com", "m.youtube.com", "youtu.be"];

const NEWS_SITES: Record<string, string> = {
  "kenh14.vn": "Kenh14",
  "gamek.vn": "GameK",
  "thanhnien.vn": "Thanh Niên",
  "tuoitre.vn": "Tuổi Trẻ",
  "vnexpress.net": "VnExpress",
  "zingnews.vn": "Znews",
  "znews.vn": "Znews",
  "tienphong.vn": "Tiền Phong",
  "dantri.com.vn": "Dân Trí",
  "vietnamnet.vn": "VietNamNet",
};

const FACEBOOK_HOSTS = ["facebook.com", "m.facebook.com", "web.facebook.com"];
/** The official page and the official group (lowercase, compared case-insensitively). */
const FACEBOOK_PATHS = [["mixigaming"], ["groups", "mixigaming"]];

export const SOURCE_HINT =
  "Nguồn nhận: video YouTube, Facebook chính chủ MixiGaming, hoặc bài trên Kenh14, GameK, Thanh Niên, Tuổi Trẻ, VnExpress, Znews, Tiền Phong, Dân Trí, VietNamNet.";

export type SourceCheck = { ok: true; url: string; label: string } | { ok: false; message: string };

function newsLabel(host: string): string | null {
  for (const [domain, label] of Object.entries(NEWS_SITES)) if (host === domain || host.endsWith(`.${domain}`)) return label;
  return null;
}

function facebookOfficial(pathname: string): boolean {
  const parts = pathname.toLowerCase().split("/").filter(Boolean);
  return FACEBOOK_PATHS.some((p) => p.every((seg, i) => parts[i] === seg));
}

/** Validates a fan-supplied source link against the allow-list; returns the normalised URL and a short label. */
export function checkSourceUrl(raw: string): SourceCheck {
  const value = raw.trim();
  if (!value) return { ok: false, message: "Cần dán link nguồn cho mục từ." };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, message: "Link nguồn chưa đúng định dạng (cần bắt đầu bằng https://)." };
  }
  if (url.protocol !== "https:") return { ok: false, message: "Link nguồn phải bắt đầu bằng https://." };
  if (url.username || url.password || url.port) return { ok: false, message: "Link nguồn chưa đúng định dạng (cần bắt đầu bằng https://)." };

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let label: string | null = null;
  if (YOUTUBE_HOSTS.includes(host)) label = "YouTube";
  else if (FACEBOOK_HOSTS.includes(host)) label = facebookOfficial(url.pathname) ? "Facebook chính chủ" : null;
  else label = newsLabel(host);
  if (!label) return { ok: false, message: `Nguồn này chưa được nhận. ${SOURCE_HINT}` };

  url.hash = "";
  const normalised = url.toString();
  if ([...normalised].length > SOURCE_MAX) return { ok: false, message: `Link nguồn tối đa ${SOURCE_MAX} ký tự.` };
  return { ok: true, url: normalised, label };
}
