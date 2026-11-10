import { describe, expect, it } from "vitest";
import { logHref, parseLogQuery } from "./log-query";

describe("parseLogQuery", () => {
  it("reads known filters and a numeric cursor", () => {
    expect(parseLogQuery({ action: "ban", kind: "profile", before: "1234" })).toEqual({ action: "ban", kind: "profile", before: 1234 });
  });
  it("ignores unknown or malformed values", () => {
    expect(parseLogQuery({ action: "drop", kind: "video", before: "-1" })).toEqual({ action: null, kind: null, before: null });
    expect(parseLogQuery({ before: "0" }).before).toBeNull();
    expect(parseLogQuery({ before: "12abc" }).before).toBeNull();
    expect(parseLogQuery({ action: ["reject", "ban"] }).action).toBe("reject");
  });
});

describe("logHref", () => {
  const q = { action: "reject", kind: "quote", before: 50 } as const;
  it("changing a filter restarts paging", () => expect(logHref(q, { kind: null })).toBe("/admin/nhat-ky?action=reject"));
  it("keeps filters when paging", () => expect(logHref(q, { before: 10 })).toBe("/admin/nhat-ky?action=reject&kind=quote&before=10"));
  it("no filters → bare path", () => expect(logHref(q, { action: null, kind: null })).toBe("/admin/nhat-ky"));
});
