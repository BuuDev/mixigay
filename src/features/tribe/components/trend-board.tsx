import { youtubeUrl } from "@/shared/lib/links";
import { Card } from "@/shared/ui/card";
import type { TrendingTopic } from "../lib/trends";

/** "Bộ Tộc đang rần rần": topics ranked by mentions in the last 30 days of titles. */
export function TrendBoard({ topics }: { topics: TrendingTopic[] }) {
  if (!topics.length) return <p className="text-center text-sm text-muted">Chưa có dữ liệu stream gần đây.</p>;
  const max = topics[0].count;
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {topics.map((t, i) => (
        <li key={t.id}>
          <Card className="relative overflow-hidden p-4">
            <div aria-hidden className="absolute inset-y-0 left-0 bg-accent/10" style={{ width: `${Math.round((t.count / max) * 100)}%` }} />
            <div className="relative flex items-start gap-3">
              <span className="font-mono text-2xl font-black text-transparent [-webkit-text-stroke:1px_var(--td-ember)]">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <p className="font-bold">{t.label}</p>
                <p className="text-xs text-muted">{t.count} buổi/video trong 30 ngày</p>
                <a href={youtubeUrl(t.latest.videoId)} target="_blank" rel="noopener noreferrer" className="mt-1 line-clamp-1 text-xs text-accent hover:underline">
                  Mới nhất: {t.latest.title}
                </a>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}
