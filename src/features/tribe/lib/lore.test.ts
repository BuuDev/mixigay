import { describe, expect, it } from "vitest";
import { LORE } from "./lore";

describe("LORE", () => {
  it("cites an https source for every entry", () => {
    for (const e of LORE) expect(new URL(e.source.href).protocol, e.term).toBe("https:");
  });
  it("has unique terms", () => {
    expect(new Set(LORE.map((e) => e.term)).size).toBe(LORE.length);
  });
});
