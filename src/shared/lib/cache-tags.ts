/**
 * Cache tags for "use cache" reads. Getters tag their results; actions call
 * updateTag(tag) and jobs/route handlers call revalidateTag(tag, "max").
 */
export const TAGS = {
  live: "live",
  schedule: "schedule",
  games: "games",
  videos: "videos",
  played: "played",
  suggestions: "suggestions",
  songs: "songs",
  fanArt: "fan-art",
  quiz: "quiz",
  wall: "wall",
  quotes: "quotes",
  glossary: "glossary",
  tournaments: "tournaments",
  themes: "themes",
  blockedTerms: "blocked-terms",
  polls: "polls",
  /** Only /api/live: poll-live's next check time, refreshed after every check (ADR-019). */
  liveTimer: "live-timer",
} as const;
