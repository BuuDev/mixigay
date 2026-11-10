import { describe, expect, it } from "vitest";
import { mapPoll, type PollRow } from "./mapper";

const row = (over: Partial<PollRow> = {}): PollRow => ({
  id: "p1",
  question: "Tối nay anh Độ nên chơi game gì?",
  status: "open",
  closes_at: null,
  opened_at: "2026-11-10T10:00:00Z",
  closed_at: null,
  created_at: "2026-11-10T09:00:00Z",
  poll_options: [
    { id: "b", label: "B", position: 1, votes: 2, suggestion_id: null },
    { id: "a", label: "A", position: 0, votes: 5, suggestion_id: "s1" },
  ],
  ...over,
});

describe("mapPoll", () => {
  it("maps and sorts options by position", () => {
    const p = mapPoll(row());
    expect(p?.options.map((o) => o.id)).toEqual(["a", "b"]);
    expect(p?.options[0]).toEqual({ id: "a", label: "A", position: 0, votes: 5, suggestionId: "s1" });
    expect(p?.status).toBe("open");
  });
  it("drops unknown statuses", () => expect(mapPoll(row({ status: "weird" }))).toBeNull());
  it("drops polls with fewer than two options", () => {
    expect(mapPoll(row({ poll_options: [{ id: "a", label: "A", position: 0, votes: 0, suggestion_id: null }] }))).toBeNull();
    expect(mapPoll(row({ poll_options: null }))).toBeNull();
  });
  it("cleans broken vote counts", () => {
    const p = mapPoll(
      row({
        poll_options: [
          { id: "a", label: "A", position: 0, votes: -4, suggestion_id: null },
          { id: "b", label: "B", position: 1, votes: Number.NaN, suggestion_id: null },
        ],
      }),
    );
    expect(p?.options.map((o) => o.votes)).toEqual([0, 0]);
  });
});
