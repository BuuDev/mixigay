export type PlayStatus = "finished" | "playing" | "dropped";

export interface PlayedGame {
  gameSlug: string;
  status: PlayStatus;
  sessions: number;
  lastPlayed: string;
}
