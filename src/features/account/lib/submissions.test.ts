import { describe, expect, it } from "vitest";
import { CONTENT_KINDS, isLogKind, KIND_LABEL, latestSubmissions, mapSubmissions, submissionColumns, submissionStatus } from "./submissions";

const suggestion = CONTENT_KINDS[0];
const quote = CONTENT_KINDS.find((k) => k.kind === "quote")!;

describe("submissionStatus", () => {
  it("approved / pending", () => {
    expect(submissionStatus({ approved: true }, "author")).toEqual({ status: "approved", reason: null });
    expect(submissionStatus({ approved: false }, "author")).toEqual({ status: "pending", reason: null });
  });
  it("rejected wins and carries the reason", () => {
    expect(submissionStatus({ approved: false, rejected_at: "2026-11-10T00:00:00Z", rejected_reason: "Trùng" }, "author")).toEqual({
      status: "rejected",
      reason: "Trùng",
    });
    expect(submissionStatus({ rejected_at: "2026-11-10T00:00:00Z", rejected_reason: "  " }, "author").reason).toBeNull();
  });
  it("hidden only for admins (a shadow ban must not show to its target)", () => {
    expect(submissionStatus({ approved: true, hidden: true }, "admin").status).toBe("hidden");
    expect(submissionStatus({ approved: true, hidden: true }, "author").status).toBe("approved");
    expect(submissionStatus({ approved: false, hidden: true }, "author").status).toBe("pending");
  });
});

describe("mapSubmissions / latestSubmissions", () => {
  it("reads the per-table title column and drops broken rows", () => {
    const rows = [
      { id: "a", name: "Elden Ring", approved: true, created_at: "2026-11-01T00:00:00Z" },
      { id: 3 },
      { id: "b", created_at: "2026-11-02T00:00:00Z" },
    ];
    expect(mapSubmissions(suggestion, rows, "author")).toEqual([
      { id: "a", kind: "suggestion", title: "Elden Ring", createdAt: "2026-11-01T00:00:00Z", status: "approved", reason: null },
      { id: "b", kind: "suggestion", title: "", createdAt: "2026-11-02T00:00:00Z", status: "pending", reason: null },
    ]);
  });
  it("sorts newest first across kinds and limits", () => {
    const a = mapSubmissions(suggestion, [{ id: "a", name: "x", created_at: "2026-11-01T00:00:00Z" }], "author");
    const b = mapSubmissions(
      quote,
      [
        { id: "b", body: "y", created_at: "2026-11-03T00:00:00Z" },
        { id: "c", body: "z", created_at: "2026-11-02T00:00:00Z" },
      ],
      "author",
    );
    expect(latestSubmissions([a, b], 2).map((s) => s.id)).toEqual(["b", "c"]);
  });
  it("selects hidden only on suggestions, only for admins", () => {
    expect(submissionColumns(suggestion, "admin")).toContain(",hidden");
    expect(submissionColumns(suggestion, "author")).not.toContain("hidden");
    expect(submissionColumns(quote, "admin")).toBe("id,body,approved,rejected_at,rejected_reason,created_at");
  });
  it("labels every log kind", () => {
    expect(KIND_LABEL.profile).toBe("Tài khoản");
    expect(isLogKind("wall_message")).toBe(true);
    expect(isLogKind("video")).toBe(false);
  });
});
