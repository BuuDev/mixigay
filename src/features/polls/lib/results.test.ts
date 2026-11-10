import { describe, expect, it } from "vitest";
import {
  featuredPoll,
  formatVnDateTime,
  isoToVnLocal,
  isPollOpen,
  leaderIds,
  moveVote,
  parseOptionLines,
  timeLeftLabel,
  totalVotes,
  votePercents,
  vnLocalToIso,
} from "./results";
import type { Poll } from "../types";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("votePercents", () => {
  it("is all zeros when nobody voted", () => {
    expect(votePercents([0, 0, 0])).toEqual([0, 0, 0]);
    expect(votePercents([])).toEqual([]);
  });
  it("sums to 100 for equal thirds", () => {
    const p = votePercents([1, 1, 1]);
    expect(sum(p)).toBe(100);
    expect(p).toEqual([34, 33, 33]);
  });
  it("gives the extra point to the largest remainder", () => {
    expect(votePercents([2, 1])).toEqual([67, 33]);
    expect(votePercents([1, 2, 7])).toEqual([10, 20, 70]);
  });
  it("sums to 100 for awkward splits", () => {
    for (const votes of [
      [1, 1, 1, 1, 1, 1, 1],
      [7, 3, 3, 1],
      [999, 1, 1],
      [5, 0, 0, 2],
    ])
      expect(sum(votePercents(votes))).toBe(100);
  });
  it("ignores negative or broken numbers", () => {
    expect(votePercents([-3, Number.NaN, 4])).toEqual([0, 0, 100]);
  });
});

describe("leaderIds / totalVotes", () => {
  const opts = [
    { id: "a", votes: 3 },
    { id: "b", votes: 5 },
    { id: "c", votes: 5 },
  ];
  it("returns every option tied for first", () => expect(leaderIds(opts)).toEqual(["b", "c"]));
  it("has no leader without votes", () => expect(leaderIds([{ id: "a", votes: 0 }])).toEqual([]));
  it("totals", () => expect(totalVotes(opts)).toBe(13));
});

describe("isPollOpen", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  it("needs status open", () => {
    expect(isPollOpen({ status: "draft", closesAt: null }, now)).toBe(false);
    expect(isPollOpen({ status: "closed", closesAt: null }, now)).toBe(false);
    expect(isPollOpen({ status: "open", closesAt: null }, now)).toBe(true);
  });
  it("closes at the deadline", () => {
    expect(isPollOpen({ status: "open", closesAt: "2026-11-10T12:00:01Z" }, now)).toBe(true);
    expect(isPollOpen({ status: "open", closesAt: "2026-11-10T12:00:00Z" }, now)).toBe(false);
  });
});

describe("timeLeftLabel", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const at = (ms: number) => new Date(now.getTime() + ms).toISOString();
  it("is null without a deadline", () => expect(timeLeftLabel(null, now)).toBeNull());
  it("formats days, hours, minutes", () => {
    expect(timeLeftLabel(at(2 * 86400_000 + 3 * 3600_000 + 59_000), now)).toBe("Còn 2 ngày 3 giờ");
    expect(timeLeftLabel(at(86400_000), now)).toBe("Còn 1 ngày");
    expect(timeLeftLabel(at(3 * 3600_000 + 20 * 60_000), now)).toBe("Còn 3 giờ 20 phút");
    expect(timeLeftLabel(at(3600_000), now)).toBe("Còn 1 giờ");
    expect(timeLeftLabel(at(45 * 60_000 + 30_000), now)).toBe("Còn 45 phút");
  });
  it("handles the last minute and the past", () => {
    expect(timeLeftLabel(at(30_000), now)).toBe("Sắp đóng");
    expect(timeLeftLabel(at(-1), now)).toBe("Đã đóng");
  });
});

describe("moveVote", () => {
  const opts = [
    { id: "a", votes: 1 },
    { id: "b", votes: 0 },
  ];
  it("adds a first vote", () =>
    expect(moveVote(opts, null, "b")).toEqual([
      { id: "a", votes: 1 },
      { id: "b", votes: 1 },
    ]));
  it("moves a vote", () =>
    expect(moveVote(opts, "a", "b")).toEqual([
      { id: "a", votes: 0 },
      { id: "b", votes: 1 },
    ]));
  it("withdraws without going negative", () => expect(moveVote(opts, "b", null)).toEqual(opts));
  it("is a no-op for the same option", () => expect(moveVote(opts, "a", "a")).toBe(opts));
});

describe("featuredPoll", () => {
  const p = (id: string) => ({ id }) as Poll;
  it("prefers the open poll", () => expect(featuredPoll({ current: p("o"), previous: p("c") })?.id).toBe("o"));
  it("falls back to the last result", () => expect(featuredPoll({ current: null, previous: p("c") })?.id).toBe("c"));
  it("is null with nothing", () => expect(featuredPoll({ current: null, previous: null })).toBeNull());
});

describe("Vietnam time inputs", () => {
  it("reads datetime-local as UTC+7", () => expect(vnLocalToIso("2026-11-10T21:30")).toBe("2026-11-10T14:30:00.000Z"));
  it("crosses midnight", () => expect(vnLocalToIso("2026-11-11T03:00")).toBe("2026-11-10T20:00:00.000Z"));
  it("rejects junk and impossible dates", () => {
    expect(vnLocalToIso("")).toBeNull();
    expect(vnLocalToIso("2026-02-31T10:00")).toBeNull();
    expect(vnLocalToIso("2026-11-10 21:30")).toBeNull();
  });
  it("round-trips", () => expect(isoToVnLocal(vnLocalToIso("2026-12-31T23:59"))).toBe("2026-12-31T23:59"));
  it("is empty for null", () => expect(isoToVnLocal(null)).toBe(""));
  it("formats for admin lists", () => expect(formatVnDateTime("2026-11-10T14:30:00.000Z")).toBe("10/11 21:30"));
});

describe("parseOptionLines", () => {
  it("splits, trims and de-duplicates", () => {
    expect(parseOptionLines("  GTA V \n\nGta v\nGame  kinh dị\r\nĐể anh Độ chọn")).toEqual(["GTA V", "Game kinh dị", "Để anh Độ chọn"]);
  });
});
