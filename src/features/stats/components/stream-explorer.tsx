"use client";

import { useId, useState } from "react";
import { youtubeUrl } from "@/shared/lib/links";
import { isYoutubeVideoId } from "../lib/video-id";
import { IconExternal } from "@/shared/ui/icons";
import { formatCount, formatElapsed, formatLength, formatVnDate, formatVnDateTime } from "../lib/vn-time";
import type { StreamSeries } from "../types";
import { ViewerChart } from "./viewer-chart";

const titleOf = (s: StreamSeries) => s.title || "Buổi live không rõ tiêu đề";

/** Pick one of the recent streams (newest by default) and see its audience over time. */
export function StreamExplorer({ streams }: { streams: StreamSeries[] }) {
  const selectId = useId();
  const [videoId, setVideoId] = useState(streams[0]?.videoId);
  const stream = streams.find((s) => s.videoId === videoId) ?? streams[0];
  if (!stream) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm text-muted">
          Chọn buổi live
        </label>
        <select
          id={selectId}
          value={stream.videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus-visible:border-accent"
        >
          {streams.map((s) => (
            <option key={s.videoId} value={s.videoId}>
              {formatVnDate(s.startAt)} – {titleOf(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
        <div className="mb-4 space-y-1">
          <h3 className="text-base font-bold">
            <a
              href={isYoutubeVideoId(stream.videoId) ? youtubeUrl(stream.videoId) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-1.5 hover:underline"
            >
              <span className="min-w-0 break-words">{titleOf(stream)}</span>
              <IconExternal size={16} className="mt-1 shrink-0 text-muted" aria-hidden />
              <span className="sr-only">(mở trên YouTube)</span>
            </a>
          </h3>
          <p className="text-sm text-muted">
            Lên sóng {formatVnDateTime(stream.startAt)} (giờ Việt Nam) · dài {formatLength(stream.durationMinutes)} · trung bình{" "}
            {formatCount(stream.avgViewers)} người xem
          </p>
        </div>

        {stream.points.length >= 2 ? (
          <>
            <ViewerChart key={stream.videoId} stream={stream} />
            <p className="mt-2 text-xs text-muted">Trục ngang: thời gian kể từ lúc lên sóng (giờ:phút). Trục dọc: số người xem cùng lúc.</p>
            <SeriesTable stream={stream} />
          </>
        ) : (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Buổi này chưa có đủ số liệu người xem để vẽ biểu đồ.
          </p>
        )}
      </div>
    </div>
  );
}

/** The chart's data as a table: the accessible alternative to the drawing. */
function SeriesTable({ stream }: { stream: StreamSeries }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="inline-flex min-h-6 cursor-pointer items-center text-muted hover:text-foreground">Xem bảng số liệu</summary>
      <div tabIndex={0} role="region" aria-label="Bảng số người xem theo thời gian" className="mt-2 max-h-72 overflow-y-auto rounded-md border border-border">
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">Số người xem theo thời gian kể từ lúc lên sóng</caption>
          <thead className="sticky top-0 bg-surface-raised">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Phút
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Người xem
              </th>
            </tr>
          </thead>
          <tbody>
            {stream.points.map((p, i) => (
              <tr key={`${p.minute}-${i}`} className="border-t border-border">
                <td className="px-3 py-1.5">{formatElapsed(p.minute)}</td>
                <td className="px-3 py-1.5 text-right">{formatCount(p.viewers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
