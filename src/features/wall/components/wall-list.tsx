import { EmptyState } from "@/shared/ui/empty-state";
import type { WallMessage } from "../types";
import { WallMessageCard } from "./wall-message-card";

/** Approved messages, newest first, plus the author's own pending ones on top. */
export function WallList({ messages, pending = [] }: { messages: WallMessage[]; pending?: WallMessage[] }) {
  if (!messages.length && !pending.length) {
    return (
      <EmptyState art="wall-empty" title="Là người đầu tiên viết lên tường">
        Mỗi lời nhắn tối đa 140 ký tự, hiện lên tường sau khi được duyệt.
      </EmptyState>
    );
  }
  const sorted = [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {pending.map((w) => (
        <li key={w.id}>
          <WallMessageCard message={w} pending />
        </li>
      ))}
      {sorted.map((w) => (
        <li key={w.id}>
          <WallMessageCard message={w} />
        </li>
      ))}
    </ul>
  );
}
