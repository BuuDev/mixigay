// Decides whether the moderation queue needs a human now. Pure: the cron route feeds it
// counts from the last hour and sends whatever it returns.

/** New items waiting for approval, created in the last hour, per queue label. */
export type HourlyCounts = { pending: Record<string, number>; reports: number };

export const SUBMISSION_SPIKE = 20;
export const REPORT_SPIKE = 10;

export type AlertKind = "submission_spike" | "report_spike";
export interface BacklogAlert {
  kind: AlertKind;
  /** UTC hour, e.g. "2026-11-10T14": at most one alert of a kind per hour. */
  bucket: string;
  text: string;
}

export function hourBucket(now: Date): string {
  return now.toISOString().slice(0, 13);
}

export function backlogAlerts(counts: HourlyCounts, now: Date, adminUrl: string): BacklogAlert[] {
  const bucket = hourBucket(now);
  const alerts: BacklogAlert[] = [];
  const total = Object.values(counts.pending).reduce((s, n) => s + n, 0);
  if (total >= SUBMISSION_SPIKE) {
    const parts = Object.entries(counts.pending)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, n]) => `${label}: ${n}`)
      .join(", ");
    alerts.push({
      kind: "submission_spike",
      bucket,
      text: `⚠️ Góc Bộ Tộc: ${total} nội dung mới chờ duyệt trong 1 giờ qua (${parts}). Có thể đang bị spam, vào kiểm tra: ${adminUrl}`,
    });
  }
  if (counts.reports >= REPORT_SPIKE) {
    alerts.push({
      kind: "report_spike",
      bucket,
      text: `🚩 Góc Bộ Tộc: ${counts.reports} báo cáo mới trong 1 giờ qua. Xem hàng đợi: ${adminUrl}`,
    });
  }
  return alerts;
}
