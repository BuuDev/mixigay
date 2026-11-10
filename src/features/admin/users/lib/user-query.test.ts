import { describe, expect, it } from "vitest";
import { ilikeContains, parseUserQuery, tallyCounts, trustLabel } from "./user-query";

describe("parseUserQuery", () => {
  it("reads search, trust filter and a uuid", () => {
    expect(parseUserQuery({ q: "  Cú ", trust: "shadow", id: "6F9619FF-8B86-4D11-B42D-00C04FC964FF" })).toEqual({
      q: "Cú",
      trust: "shadow",
      id: "6f9619ff-8b86-4d11-b42d-00c04fc964ff",
    });
  });
  it("drops unknown values", () => {
    expect(parseUserQuery({ trust: "admin", id: "1 or 1=1" })).toEqual({ q: "", trust: null, id: null });
    expect(parseUserQuery({ q: "x".repeat(100) }).q).toHaveLength(60);
  });
});

describe("ilikeContains", () => {
  it("escapes wildcards", () => {
    expect(ilikeContains("50%_off")).toBe("%50\\%\\_off%");
    expect(ilikeContains("a\\b")).toBe("%a\\\\b%");
    expect(ilikeContains("Fan")).toBe("%Fan%");
  });
});

describe("trustLabel", () => {
  it("labels bans, nothing for normal accounts", () => {
    expect(trustLabel(-1)?.label).toBe("Bị cấm");
    expect(trustLabel(-2)?.label).toBe("Cấm ngầm");
    expect(trustLabel(0)).toBeNull();
    expect(trustLabel(1)?.label).toBe("Tin cậy");
  });
});

describe("tallyCounts", () => {
  it("counts rejected before approved before pending, per author", () => {
    const m = tallyCounts([
      { author_id: "a", approved: true, rejected_at: null },
      { author_id: "a", approved: false, rejected_at: "2026-11-10T00:00:00Z" },
      { author_id: "a", approved: false, rejected_at: null },
      { author_id: "b", approved: null, rejected_at: null },
    ]);
    expect(m.get("a")).toEqual({ pending: 1, approved: 1, rejected: 1 });
    expect(m.get("b")).toEqual({ pending: 1, approved: 0, rejected: 0 });
  });
});
