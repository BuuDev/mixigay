import { describe, expect, it } from "vitest";
import { CHARITY_DISCLAIMER, CHARITY_MILESTONES } from "./milestones";

describe("charity milestones", () => {
  it("cite https sources", () => {
    for (const m of CHARITY_MILESTONES) expect(new URL(m.source.href).protocol, m.title).toBe("https:");
  });
  it("never contain anything that looks like a bank account number", () => {
    // Visible text only (source URLs legitimately contain long article ids).
    const text = CHARITY_MILESTONES.map((m) => `${m.when} ${m.title} ${m.detail} ${m.source.label}`).join(" ") + CHARITY_DISCLAIMER;
    expect(text).not.toMatch(/\d{8,}/);
    expect(text.toLowerCase()).not.toMatch(/stk|số tài khoản:\s*\d/);
  });
});
