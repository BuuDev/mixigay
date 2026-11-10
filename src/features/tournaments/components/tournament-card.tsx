import { youtubeUrl } from "@/shared/lib/links";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { IconExternal, IconSchedule } from "@/shared/ui/icons";
import { formatDateRange, KIND_LABEL, STATUS_LABEL } from "../lib/tournaments";
import type { Tournament, TournamentStatus } from "../types";
import { ResultsTable } from "./results-table";

const STATUS_TONE: Record<TournamentStatus, BadgeTone> = { running: "accent", upcoming: "steam", finished: "cleared" };

const linkClass = "inline-flex min-h-6 items-center gap-1 text-sm font-semibold text-accent underline underline-offset-2 hover:text-accent-glow";

/** One tournament. Video and source link out (ADR-002: never embedded). */
export function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const dates = formatDateRange(t.startsOn, t.endsOn);
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="muted">{KIND_LABEL[t.kind]}</Badge>
        <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
      </div>
      <h3 className="text-lg font-bold">{t.name}</h3>
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <IconSchedule size={16} />
        {dates ? <span>{dates} (giờ Việt Nam)</span> : <span>Chưa có ngày, chờ admin cập nhật</span>}
      </p>
      {t.description && <p className="text-sm">{t.description}</p>}
      {t.status === "finished" &&
        (t.results.length > 0 ? (
          <ResultsTable caption={`Kết quả ${t.name}`} results={t.results} />
        ) : (
          <p className="text-sm text-muted">Chưa có kết quả, chờ admin cập nhật từ sóng chính thức.</p>
        ))}
      {(t.videoId || t.sourceUrl) && (
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1">
          {t.videoId && (
            <a href={youtubeUrl(t.videoId)} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <IconExternal size={16} />
              Xem sóng trên YouTube<span className="sr-only">: {t.name}</span>
            </a>
          )}
          {t.sourceUrl && (
            <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <IconExternal size={16} />
              Nguồn<span className="sr-only">: {t.name}</span>
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
