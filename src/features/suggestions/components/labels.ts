import type { BadgeTone } from "@/shared/ui/badge";
import type { LineupReason, SortMode } from "../lib/ranking";
import type { SuggestionSource, SuggestionStatus } from "../types";

export const SOURCE: Record<SuggestionSource, { label: string; tone: BadgeTone }> = {
  steam: { label: "Steam", tone: "steam" },
  "viewer-made": { label: "Bộ Tộc tự làm", tone: "viewer" },
  other: { label: "Khác", tone: "misc" },
};

export const STATUS: Record<SuggestionStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Đang chờ", tone: "muted" },
  played: { label: "Anh Độ đã chơi", tone: "cleared" },
  rejected: { label: "Từ chối", tone: "danger" },
};

export const PLAY_LABEL: Record<string, string> = { playing: "Anh Độ đang chơi", finished: "Anh Độ đã phá đảo", dropped: "Anh Độ đã drop" };

export const fieldClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2";

/** Chip tones for the "Ứng viên tối nay" reasons and the board badges. */
export const REASON_TONE: Record<LineupReason, BadgeTone> = { hot: "accent", new: "misc", fan: "viewer" };

/** Board tabs (`?sort=`), in display order. */
export const SORT_LABEL: Record<SortMode, string> = {
  hot: "Đang hot",
  new: "Mới đề xuất",
  fan: "Bộ Tộc tự làm",
  top: "Nhiều vote nhất",
};
