import { isVideoId } from "@/features/quotes/lib/moment";
import type { QuizLink } from "../types";
import { quizPlatform } from "./quiz-url";

export interface QuizLinkRow {
  id: string;
  author_id?: string;
  title: string;
  url: string;
  description: string | null;
  played_video_id: string | null;
  played_at_seconds: number | null;
  approved: boolean;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

// `!author_id`: name the FK so PostgREST never sees two paths (docs/07-conventions.md).
export const QUIZ_LINK_SELECT = "id,author_id,title,url,description,played_video_id,played_at_seconds,approved,created_at,profiles!author_id(display_name)";

/** Null for a row that cannot be shown (no title, or a link outside the platform whitelist). */
export function mapQuizLink(r: QuizLinkRow): QuizLink | null {
  const title = typeof r.title === "string" ? r.title.trim() : "";
  const url = typeof r.url === "string" ? r.url.trim() : "";
  const platform = quizPlatform(url);
  if (!title || !platform) return null;
  const description = typeof r.description === "string" ? r.description.trim() : "";
  const playedVideoId = typeof r.played_video_id === "string" && isVideoId(r.played_video_id) ? r.played_video_id : undefined;
  const at = Number(r.played_at_seconds);
  const playedAtSeconds = playedVideoId && r.played_at_seconds !== null && Number.isInteger(at) && at >= 0 ? at : undefined;
  return {
    id: r.id,
    title,
    url,
    platform,
    description: description || undefined,
    author: r.profiles?.display_name?.trim() || "Fan",
    authorId: r.author_id,
    playedVideoId,
    playedAtSeconds,
    approved: r.approved === true,
    createdAt: r.created_at,
  };
}

export function mapQuizLinks(rows: QuizLinkRow[]): QuizLink[] {
  return rows.map(mapQuizLink).filter((l): l is QuizLink => l !== null);
}

/** Splits the board into what anh Độ already played and what is still waiting, each newest first. */
export function groupQuizLinks(links: QuizLink[]): { played: QuizLink[]; fresh: QuizLink[] } {
  const sorted = [...links].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { played: sorted.filter((l) => l.playedVideoId), fresh: sorted.filter((l) => !l.playedVideoId) };
}
