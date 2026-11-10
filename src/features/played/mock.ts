import type { PlayedGame } from "./types";

// Sample statuses for mock mode (session counts are illustrative).
// PUBG: dropped after the PUBG Asia Stars 2026 controversy (Độ deleted the game on stream, 23/09/2026).
export const playedGames: PlayedGame[] = [
  { gameSlug: "delta-force", status: "playing", sessions: 42, lastPlayed: "2026-11-01" },
  { gameSlug: "gta-v", status: "playing", sessions: 30, lastPlayed: "2026-11-08" },
  { gameSlug: "the-isle", status: "playing", sessions: 25, lastPlayed: "2026-10-20" },
  { gameSlug: "business-sim", status: "finished", sessions: 18, lastPlayed: "2026-11-03" },
  { gameSlug: "viewer-made", status: "playing", sessions: 9, lastPlayed: "2026-11-04" },
  { gameSlug: "pubg", status: "dropped", sessions: 1200, lastPlayed: "2026-09-23" },
];
