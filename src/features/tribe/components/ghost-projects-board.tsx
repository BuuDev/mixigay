import { formatDate } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { GHOST_PROJECTS } from "../lib/ghost-projects";

/**
 * "Hồ sơ Dự Án Ma · Bộ Tộc vẫn hóng": plans announced on stream, presented with a warm
 * "Bộ Tộc vẫn hóng" badge (no public debt/day counter) and a prominent "ĐÃ LÀM THẬT" stamp
 * once completed.
 */
export function GhostProjectsBoard() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {GHOST_PROJECTS.map((p) => (
        <li key={p.id}>
          <Card className="flex h-full flex-col justify-between p-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {p.doneVideoId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border-2 border-cleared bg-cleared/20 px-3 py-1 text-xs font-extrabold tracking-wider text-cleared uppercase shadow-sm">
                    ✓ Đã làm thật
                  </span>
                ) : (
                  <Badge tone="accent">🔥 Bộ Tộc vẫn hóng</Badge>
                )}
                <span className="font-mono text-xs text-muted">
                  Nhắc trên sóng {p.approx ? "~" : ""}
                  {formatDate(p.announcedAt)}
                </span>
              </div>
              <h3 className="mt-2 font-bold leading-snug">{p.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">“{p.quote}”</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-2.5 text-xs">
              <a href={youtubeUrl(p.videoId)} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
                Xem lại buổi tâm sự ↗
              </a>
              {p.doneVideoId && (
                <a href={youtubeUrl(p.doneVideoId)} target="_blank" rel="noopener noreferrer" className="font-bold text-cleared hover:underline">
                  Xem video thực hiện ↗
                </a>
              )}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
