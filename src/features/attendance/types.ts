import type { NextStreamSlot } from "@/features/schedule/types";

/** What tonight looks like for the RSVP block, from the schedule + overrides. */
export type TonightPlan =
  /** A stream happens today (Vietnam day); `time` is "HH:mm" Vietnam time. */
  | { kind: "stream"; dateVn: string; time: string }
  /** No stream today; `next` is the following one, if any. */
  | { kind: "off"; dateVn: string; next: NextStreamSlot | null };

/** Server-side state of today's RSVP, read per request. */
export interface AttendanceSnapshot {
  /** "YYYY-MM-DD", Vietnam calendar day the count belongs to. */
  dateVn: string;
  /** Signed-in fans who tapped today (guests are never counted). */
  count: number;
  /** Whether the signed-in viewer already tapped today. */
  attended: boolean;
  signedIn: boolean;
}
