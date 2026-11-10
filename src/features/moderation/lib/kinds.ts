import { driveImageUrl } from "@/features/fan-art/lib/drive";
import { formatClock, quoteMomentUrl } from "@/features/quotes/lib/moment";
import { isSteamArtUrl } from "@/features/suggestions/lib/image-policy";
import { thumbnailUrlFor } from "@/features/suggestions/lib/mapper";
import { TAGS } from "@/shared/lib/cache-tags";

// One registry for every kind of fan content that waits for approval
// (supabase/migrations/20261110200000_moderation_center.sql adds rejected_at / rejected_reason to each).

export const KIND_IDS = ["suggestion", "fan_song", "fan_art", "quiz_link", "quote", "glossary_entry", "wall_message"] as const;
export type ContentKind = (typeof KIND_IDS)[number];

/** What the inbox shows for one pending row, whatever its table. */
export interface InboxItem {
  kind: ContentKind;
  id: string;
  createdAt: string;
  authorId: string;
  title: string;
  body?: string;
  url?: string;
  imageUrl?: string;
  /** Short secondary line: artist, source, video moment… */
  extra?: string;
}

export type Row = Record<string, unknown>;

export interface KindDef {
  kind: ContentKind;
  table: string;
  label: string;
  adminHref: string;
  cacheTag: string;
  select: string;
  /** Pending also requires hidden = false (suggestions only). */
  hiddenColumn?: boolean;
  map: (row: Row) => Omit<InboxItem, "kind" | "id" | "createdAt" | "authorId">;
}

const text = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const https = (v: unknown): string | undefined => {
  const s = text(v);
  return s && /^https?:\/\//i.test(s) ? s : undefined;
};
const DRIVE_ID = /^[A-Za-z0-9_-]{10,80}$/;
const SOURCE_LABEL: Record<string, string> = { steam: "Steam", "viewer-made": "Game viewer làm", other: "Khác" };

function steamHeader(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const header = (data as Record<string, unknown>).headerImage;
  return typeof header === "string" && isSteamArtUrl(header) ? header : undefined;
}

export const CONTENT_KINDS: Record<ContentKind, KindDef> = {
  suggestion: {
    kind: "suggestion",
    table: "suggestions",
    label: "Đề xuất game",
    adminHref: "/admin/de-xuat",
    cacheTag: TAGS.suggestions,
    select: "id,author_id,name,reason,url,source,steam_data,thumbnail_path,created_at",
    hiddenColumn: true,
    map: (r) => ({
      title: text(r.name) ?? "(không tên)",
      body: text(r.reason),
      url: https(r.url),
      imageUrl: thumbnailUrlFor(typeof r.thumbnail_path === "string" ? r.thumbnail_path : null) ?? steamHeader(r.steam_data),
      extra: SOURCE_LABEL[String(r.source)],
    }),
  },
  fan_song: {
    kind: "fan_song",
    table: "fan_songs",
    label: "Nhạc nịnh",
    adminHref: "/admin/nhac",
    cacheTag: TAGS.songs,
    select: "id,author_id,title,artist,url,note,thumbnail_url,created_at",
    map: (r) => ({
      title: text(r.title) ?? "(không tên)",
      body: text(r.note),
      url: https(r.url),
      imageUrl: https(r.thumbnail_url),
      extra: text(r.artist),
    }),
  },
  fan_art: {
    kind: "fan_art",
    table: "fan_art",
    label: "Tranh fan art",
    adminHref: "/admin/fan-art",
    cacheTag: TAGS.fanArt,
    select: "id,author_id,title,artist,drive_url,drive_file_id,note,created_at",
    map: (r) => ({
      title: text(r.title) ?? "(không tên)",
      body: text(r.note),
      url: https(r.drive_url),
      imageUrl: typeof r.drive_file_id === "string" && DRIVE_ID.test(r.drive_file_id) ? driveImageUrl(r.drive_file_id, 400) : undefined,
      extra: text(r.artist),
    }),
  },
  quiz_link: {
    kind: "quiz_link",
    table: "quiz_links",
    label: "Link quiz",
    adminHref: "/admin/quiz",
    cacheTag: TAGS.quiz,
    select: "id,author_id,title,url,description,created_at",
    map: (r) => ({ title: text(r.title) ?? "(không tên)", body: text(r.description), url: https(r.url) }),
  },
  quote: {
    kind: "quote",
    table: "quotes",
    label: "Quote",
    adminHref: "/admin/quote",
    cacheTag: TAGS.quotes,
    select: "id,author_id,body,video_id,at_seconds,created_at",
    map: (r) => {
      const moment = typeof r.video_id === "string" && typeof r.at_seconds === "number";
      return {
        title: `“${text(r.body) ?? ""}”`,
        url: moment ? quoteMomentUrl(r.video_id as string, r.at_seconds as number) : undefined,
        extra: moment ? `video ${r.video_id as string} @ ${formatClock(r.at_seconds as number)}` : undefined,
      };
    },
  },
  glossary_entry: {
    kind: "glossary_entry",
    table: "glossary_entries",
    label: "Từ điển",
    adminHref: "/admin/tu-dien",
    cacheTag: TAGS.glossary,
    select: "id,author_id,term,meaning,source_url,created_at",
    map: (r) => ({ title: text(r.term) ?? "(không tên)", body: text(r.meaning), url: https(r.source_url) }),
  },
  wall_message: {
    kind: "wall_message",
    table: "wall_messages",
    label: "Lời nhắn",
    adminHref: "/admin/tuong",
    cacheTag: TAGS.wall,
    select: "id,author_id,body,created_at",
    map: (r) => ({ title: text(r.body) ?? "" }),
  },
};

export const KIND_LIST: KindDef[] = KIND_IDS.map((k) => CONTENT_KINDS[k]);

export function isContentKind(v: unknown): v is ContentKind {
  return typeof v === "string" && (KIND_IDS as readonly string[]).includes(v);
}

/** Maps one row of the kind's table (selected with `select`) to an inbox item; null when the row is unusable. */
export function toInboxItem(kind: ContentKind, row: Row): InboxItem | null {
  if (typeof row.id !== "string" || typeof row.author_id !== "string" || typeof row.created_at !== "string") return null;
  return { kind, id: row.id, createdAt: row.created_at, authorId: row.author_id, ...CONTENT_KINDS[kind].map(row) };
}

/** The texts the screen runs over (titles, bodies, links, artist). */
export function screenFields(item: InboxItem): string[] {
  // A quote's link is built by the site from its video id (always youtube.com), so screening it
  // only produced a false "tên miền" flag; fan-typed links are still screened.
  const url = item.kind === "quote" ? undefined : item.url;
  return [item.title, item.body, url, item.extra].filter((s): s is string => Boolean(s));
}

/** Host of a link, shown as text so the admin sees where it goes before opening it. */
export function linkHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
