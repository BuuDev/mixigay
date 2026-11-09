import { DAY_NAMES } from "@/features/schedule/lib/schedule";
import { clockDomain } from "../lib/chart";
import { formatClock } from "../lib/vn-time";
import type { WeekdayStart } from "../types";

/** Average start time per weekday as a table; each row carries a dot on a shared evening time line. */
export function WeekdayStarts({ weekdays }: { weekdays: WeekdayStart[] }) {
  const values = weekdays.flatMap((d) => (d.avgStartMinute === null ? [] : [d.avgStartMinute]));
  const [from, to] = clockDomain(values);
  const pos = (m: number) => `${((m - from) / (to - from)) * 100}%`;

  return (
    <table className="w-full table-fixed text-sm tabular-nums">
      <caption className="sr-only">Giờ lên sóng trung bình theo thứ trong tuần, giờ Việt Nam</caption>
      <colgroup>
        <col className="w-[4.5rem]" />
        <col className="w-[4rem]" />
        <col />
        <col className="w-[3.5rem]" />
      </colgroup>
      <thead>
        <tr className="text-left text-xs text-muted">
          <th scope="col" className="pb-2 font-normal">
            Thứ
          </th>
          <th scope="col" className="pb-2 font-normal">
            Giờ TB
          </th>
          <th scope="col" className="pb-2 font-normal">
            <span className="sr-only">Vị trí trên trục giờ</span>
            <span aria-hidden className="flex justify-between">
              <span>{formatClock(from)}</span>
              <span>{formatClock(to)}</span>
            </span>
          </th>
          <th scope="col" className="pb-2 text-right font-normal">
            Số buổi
          </th>
        </tr>
      </thead>
      <tbody>
        {weekdays.map((d) => (
          <tr key={d.weekday} className="border-t border-border">
            <th scope="row" className="py-2.5 text-left font-semibold">
              {DAY_NAMES[d.weekday]}
            </th>
            <td className={d.avgStartMinute === null ? "py-2.5 text-muted" : "py-2.5 font-semibold"}>
              {d.avgStartMinute === null ? <span>Chưa có</span> : formatClock(d.avgStartMinute)}
            </td>
            <td className="py-2.5 pr-3" aria-hidden>
              <div className="relative h-2 rounded-pill bg-surface-raised">
                {d.avgStartMinute !== null && (
                  <span
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-surface bg-accent"
                    style={{ left: pos(d.avgStartMinute) }}
                  />
                )}
              </div>
            </td>
            <td className="py-2.5 text-right text-muted">{d.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
