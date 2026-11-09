import type { BadgeTone } from "@/shared/ui/badge";
import type { SuggestionSource, SuggestionStatus } from "../types";

export const SOURCE: Record<SuggestionSource, { label: string; tone: BadgeTone }> = {
  steam: { label: "Steam", tone: "steam" },
  "viewer-made": { label: "Game viewer làm", tone: "viewer" },
  other: { label: "Khác", tone: "misc" },
};

export const STATUS: Record<SuggestionStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Đang chờ", tone: "muted" },
  played: { label: "Anh Độ đã chơi", tone: "cleared" },
  rejected: { label: "Từ chối", tone: "danger" },
};

export const PLAY_LABEL: Record<string, string> = { playing: "Anh Độ đang chơi", finished: "Anh Độ đã phá đảo", dropped: "Anh Độ đã drop" };

export const fieldClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2";
