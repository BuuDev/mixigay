"use client";

import { useNow } from "@/shared/hooks/use-now";
import { formatDate } from "@/shared/lib/format";
import { youtubeUrl } from "@/shared/lib/links";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { daysSince, GHOST_PROJECTS } from "../lib/ghost-projects";

/**
 * "Hồ sơ Dự Án Ma": plans announced on stream, showing how many Vietnam calendar
 * days have elapsed since the broadcast and linking to the exact restream.
 */
export function GhostProjectsBoard() {
  const now = useNow();

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {GHOST_PROJECTS.map((p) => {
        const elapsed = now ? daysSince(p.announcedAt, now) : null;
        return (
          <li key={p.id}>
            <Card className="flex h-full flex-col justify-between p-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {p.doneVideoId ? (
                    <Badge tone="cleared">Đã làm thật</Badge>
                  ) : (
                    <Badge tone="accent">
                      {elapsed === null ? "Đang đếm ngày…" : `${p.approx ? "~" : ""}${elapsed} ngày kể từ lúc hứa`}
                    </Badge>
                  )}
                  <span className="font-mono text-xs text-muted">
                    {p.approx ? "~" : ""}
                    {formatDate(p.announcedAt)}
                  </span>
                </div>
                <h3 className="mt-2 font-bold leading-snug">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">“{p.quote}”</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-2.5 text-xs">
                <a
                  href={youtubeUrl(p.videoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent hover:underline"
                >
                  Buổi stream vẽ dự án ↗
                </a>
                {p.doneVideoId && (
                  <a
                    href={youtubeUrl(p.doneVideoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-cleared hover:underline"
                  >
                    Video làm thật ↗
                  </a>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
