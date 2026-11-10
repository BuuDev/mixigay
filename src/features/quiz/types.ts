/** Quiz platforms the board accepts (same whitelist as the quiz_links.url CHECK). */
export type QuizPlatform = "kahoot" | "wayground" | "wordwall" | "quizlet" | "blooket" | "google-forms";

/** A quiz a fan made on an outside platform for anh Độ to play on stream. The site only links out. */
export interface QuizLink {
  id: string;
  title: string;
  url: string;
  platform: QuizPlatform;
  description?: string;
  /** Display name of the fan who shared it. */
  author: string;
  /** For moderation tools (report button, admin). */
  authorId?: string;
  /** Set by admins once anh Độ played it on stream: the video it happened in… */
  playedVideoId?: string;
  /** …and the second it starts at, when known. */
  playedAtSeconds?: number;
  approved: boolean;
  createdAt: string;
}
