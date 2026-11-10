import type { TournamentResult } from "../types";

/** Final standings as entered by admin from the official stream. */
export function ResultsTable({ caption, results }: { caption: string; results: TournamentResult[] }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="text-xs text-muted">
        <tr className="border-b border-border">
          <th scope="col" className="w-12 py-1 pr-2 font-semibold">
            Hạng
          </th>
          <th scope="col" className="py-1 pr-2 font-semibold">
            Tên
          </th>
          <th scope="col" className="py-1 font-semibold">
            Ghi chú
          </th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr key={r.rank} className="border-b border-border/60 last:border-0">
            <td className="py-1 pr-2 font-mono font-semibold text-accent">#{r.rank}</td>
            <th scope="row" className="py-1 pr-2 font-medium">
              {r.name}
            </th>
            <td className="py-1 text-muted">{r.note ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
