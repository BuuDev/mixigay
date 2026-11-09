// Row shapes as stored in Postgres (supabase/migrations). Mapped to the app's
// camelCase types in src/lib/data.ts and never passed to components directly.
// Replace with `supabase gen types typescript` output once the CLI is in use.

export interface GameRow {
  slug: string;
  name: string;
  is_vlog: boolean;
  cover_url: string | null;
  sort_order: number;
  game_keywords?: { keyword: string }[];
}

export interface VideoRow {
  video_id: string;
  title: string;
  published_at: string;
  duration_seconds: number;
  view_count: number;
  thumbnail_url: string | null;
  was_live: boolean;
  playlist_ids: string[];
  manual_game_slug: string | null;
  auto_game_slug: string | null;
}

export interface LiveStatusRow {
  state: "live" | "upcoming" | "offline";
  video_id: string | null;
  title: string | null;
  start_time: string | null;
  concurrent_viewers: number | null;
  checked_at: string | null;
}

export interface ScheduleSlotRow {
  id: string;
  day_of_week: number;
  time_vn: string;
  title: string;
  game_slug: string | null;
  note: string | null;
}

export interface PlayedGameRow {
  game_slug: string;
  status: "playing" | "finished" | "dropped";
  sessions: number;
  last_played: string | null;
}

export interface SuggestionRow {
  id: string;
  name: string;
  source: "steam" | "viewer-made" | "other";
  url: string | null;
  reason: string;
  status: "pending" | "played" | "rejected";
  linked_game_slug: string | null;
  steam_app_id: number | null;
  steam_data: { price: string; genres: string[]; headerImage?: string } | null;
  upvotes: number;
  hidden: boolean;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
}
