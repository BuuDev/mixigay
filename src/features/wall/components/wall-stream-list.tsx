import { getWallMessages } from "../server/queries";
import { VerifiedMark } from "./wall-message-card";
import { RelativeTime } from "./relative-time";
import { isSupabaseConfigured } from "@/shared/lib/env";
import { Card } from "@/shared/ui/card";

/** Latest approved messages in big type, for reading out on stream (/gui-anh-do). */
export async function WallStreamList({ limit = 6 }: { limit?: number }) {
  const messages = (await getWallMessages()).slice(0, limit);
  if (!messages.length) return null;
  return (
    <>
      {!isSupabaseConfigured && <p className="mb-3 text-sm text-muted">Dữ liệu mẫu (chế độ demo): đây chưa phải lời nhắn thật của Bộ Tộc.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {messages.map((w) => (
          <li key={w.id}>
            <Card className="flex h-full flex-col justify-between gap-4 border-2 p-6">
              <p className="text-xl leading-relaxed font-bold break-words text-foreground sm:text-2xl">“{w.body}”</p>
              <p className="flex flex-wrap items-center gap-2 text-base text-muted">
                <span className="font-semibold text-accent">{w.author}</span>
                {w.authorVerified && <VerifiedMark />}
                <span aria-hidden>·</span>
                <RelativeTime iso={w.createdAt} />
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
