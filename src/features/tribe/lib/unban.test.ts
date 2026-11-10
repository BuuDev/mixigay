import { describe, expect, it } from "vitest";
import { composeUnbanPlea, UNBAN_OFFENSES, UNBAN_STYLES } from "./unban";

describe("composeUnbanPlea", () => {
  it("builds a complete apology letter containing the applicant name and offense", () => {
    const res = composeUnbanPlea({
      applicantName: "Fan Yên Lãng",
      offenseId: "harmonica-pain",
      styleId: "flattery-master",
      roll: 0,
    });
    expect(res.title).toContain("Fan Yên Lãng");
    expect(res.body).toContain("Fan Yên Lãng");
    expect(res.body).toContain("Harmonica");
    expect(res.verdict.mercyScore).toBeGreaterThanOrEqual(12);
    expect(res.verdict.mercyScore).toBeLessThanOrEqual(99);
  });

  it("falls back to a default name when blank", () => {
    const res = composeUnbanPlea({
      applicantName: "   ",
      offenseId: UNBAN_OFFENSES[0].id,
      styleId: UNBAN_STYLES[0].id,
    });
    expect(res.body).toContain("Tộc nhân đang lạnh cóng ngoài khơi");
  });
});

