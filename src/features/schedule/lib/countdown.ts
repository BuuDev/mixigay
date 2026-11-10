/** "HH:MM:SS", or "N ngày HH:MM:SS" past a day. Negative durations clamp to zero. */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86_400);
  const hms = [Math.floor((s % 86_400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  return d ? `${d} ngày ${hms}` : hms;
}
