import type { PlayedGame } from "./types";

export const playedGames: PlayedGame[] = [
  { gameSlug: "pubg", status: "playing", sessions: 412, lastPlayed: "2026-11-08" },
  { gameSlug: "gta-v", status: "playing", sessions: 268, lastPlayed: "2026-11-07" },
  { gameSlug: "cs2", status: "playing", sessions: 97, lastPlayed: "2026-11-06" },
  { gameSlug: "horror", status: "finished", sessions: 35, lastPlayed: "2026-11-05" },
  { gameSlug: "lol", status: "dropped", sessions: 6, lastPlayed: "2026-10-30" },
  { gameSlug: "viewer-made", status: "finished", sessions: 12, lastPlayed: "2026-11-01" },
];
