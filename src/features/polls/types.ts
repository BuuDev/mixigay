export type PollStatus = "draft" | "open" | "closed";

export interface PollOption {
  id: string;
  label: string;
  position: number;
  votes: number;
  /** Set when the option came from a fan suggestion (admin "tạo từ đề xuất"). */
  suggestionId: string | null;
}

export interface Poll {
  id: string;
  question: string;
  status: PollStatus;
  /** UTC ISO; null = open until an admin closes it. */
  closesAt: string | null;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  /** Sorted by position. */
  options: PollOption[];
}

/** What the home page shows: the newest open poll, and the newest closed one with its result. */
export interface PollBoard {
  current: Poll | null;
  previous: Poll | null;
}

/** Per-request, never cached: who is looking and what they picked. */
export interface PollViewer {
  signedIn: boolean;
  /** The option the viewer voted for in this poll, if any. */
  optionId: string | null;
}

export type PollActionResult = { ok: true } | { ok: false; message: string };
