import type { PlayedGame } from "../types";

export interface PlayedGameRow {
  game_slug: string;
  status: "playing" | "finished" | "dropped";
  sessions: number;
  last_played: string | null;
}

export function mapPlayed(r: PlayedGameRow): PlayedGame {
  return { gameSlug: r.game_slug, status: r.status, sessions: r.sessions, lastPlayed: r.last_played ?? "" };
}
