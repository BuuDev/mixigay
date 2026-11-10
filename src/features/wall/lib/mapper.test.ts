import { describe, expect, it } from "vitest";
import { mapWallMessage, mapWallMessages } from "./mapper";

const row = {
  id: "w1",
  author_id: "u1",
  body: "  Chúc anh Độ sóng nào cũng vui  ",
  approved: true,
  created_at: "2026-11-10T00:00:00Z",
  profiles: { display_name: "tocdo_86", verified: false },
};

describe("mapWallMessage", () => {
  it("maps a row and trims the body", () => {
    expect(mapWallMessage(row)).toEqual({
      id: "w1",
      body: "Chúc anh Độ sóng nào cũng vui",
      author: "tocdo_86",
      authorId: "u1",
      authorVerified: false,
      createdAt: "2026-11-10T00:00:00Z",
      approved: true,
    });
  });
  it("only shows the verified badge for verified === true", () => {
    expect(mapWallMessage({ ...row, profiles: { display_name: "x", verified: true } })?.authorVerified).toBe(true);
    expect(mapWallMessage({ ...row, profiles: { display_name: "x", verified: null } })?.authorVerified).toBe(false);
  });
  it("falls back to “Fan” without a profile or name", () => {
    expect(mapWallMessage({ ...row, profiles: null })?.author).toBe("Fan");
    expect(mapWallMessage({ ...row, profiles: { display_name: "  " } })?.author).toBe("Fan");
  });
  it("drops rows with no visible text", () => {
    expect(mapWallMessage({ ...row, body: "   " })).toBeNull();
    expect(mapWallMessages([row, { ...row, id: "w2", body: "" }]).map((m) => m.id)).toEqual(["w1"]);
  });
});
