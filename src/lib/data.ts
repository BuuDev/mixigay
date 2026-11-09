// Data access for pages. Each function is async so swapping the mock arrays for
// Supabase queries later does not change any caller.
import { classifyVideo } from "./classify";
import * as mock from "./mock-data";
import type { Video } from "./types";

export type ClassifiedVideo = Video & { gameSlug: string };

export async function getLiveStatus() {
  return mock.liveStatus;
}

export async function getSchedule() {
  return mock.schedule;
}

export async function getGames() {
  return mock.games;
}

export async function getVideos(): Promise<ClassifiedVideo[]> {
  return mock.videos.map((v) => ({ ...v, gameSlug: classifyVideo(v, mock.games) }));
}

export async function getPlayedGames() {
  return mock.playedGames;
}

export async function getSuggestions() {
  return mock.suggestions;
}
