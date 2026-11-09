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
} as const;
