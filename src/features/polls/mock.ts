import type { PollBoard } from "./types";

// Demo mode only (no Supabase). The card labels this as "dữ liệu mẫu": the numbers are
// made up for the layout and are never presented as real votes. Voting stays in the tab.
export const board: PollBoard = {
  current: {
    id: "demo-poll",
    question: "Tối nay anh Độ nên chơi game gì? (bình chọn mẫu)",
    status: "open",
    closesAt: null,
    openedAt: null,
    closedAt: null,
    createdAt: "2026-11-10T00:00:00.000Z",
    options: [
      { id: "demo-a", label: "Game kinh dị indie", position: 0, votes: 12, suggestionId: null },
      { id: "demo-b", label: "Game do fan làm", position: 1, votes: 9, suggestionId: null },
      { id: "demo-c", label: "Game sinh tồn chơi cùng anh em", position: 2, votes: 7, suggestionId: null },
      { id: "demo-d", label: "Để anh Độ tự chọn", position: 3, votes: 4, suggestionId: null },
    ],
  },
  previous: null,
};
