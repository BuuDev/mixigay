import type { StreamStats } from "../types";
import { formatCount, formatDayKey, formatLength, formatVnDate } from "../lib/vn-time";

interface Tile {
  label: string;
  value: string;
  note: string;
}

function tiles(stats: StreamStats): Tile[] {
  const best = stats.top[0];
  return [
    { label: "Số buổi live", value: formatCount(stats.streamCount), note: `trong ${stats.windowDays} ngày gần nhất` },
    {
      label: "Thời lượng trung bình",
      value: stats.avgDurationMinutes === null ? "Chưa rõ" : formatLength(stats.avgDurationMinutes),
      note: "từ lúc lên sóng tới lúc tắt live",
    },
    {
      label: "Chuỗi ngày live liên tiếp",
      value: stats.streak ? `${stats.streak.days} ngày` : "Chưa rõ",
      note: stats.streak
        ? stats.streak.days > 1
          ? `${formatDayKey(stats.streak.from)} – ${formatDayKey(stats.streak.to)}`
          : formatDayKey(stats.streak.from)
        : "chưa có buổi nào",
    },
    {
      label: "Đông nhất một lúc",
      value: best ? `${formatCount(best.peakViewers)} người` : "Chưa rõ",
      note: best ? `buổi ${formatVnDate(best.startAt)}` : "chưa có số người xem",
    },
  ];
}

/** Four equal-height headline numbers. */
export function StatTiles({ stats }: { stats: StreamStats }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles(stats).map((t) => (
        <div key={t.label} className="flex h-full flex-col rounded-lg border border-border bg-surface p-4 shadow-card">
          <dt className="text-sm text-muted">{t.label}</dt>
          <dd className="mt-1 text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl">{t.value}</dd>
          <dd className="mt-auto pt-1 text-xs text-muted">{t.note}</dd>
        </div>
      ))}
    </dl>
  );
}
