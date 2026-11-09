import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

const origin = "https://fan.example";

describe("safeNext", () => {
  it("keeps same-site paths with query and hash", () => {
    expect(safeNext("/de-xuat?tab=1#form", origin)).toBe("/de-xuat?tab=1#form");
  });

  it.each([null, "", "de-xuat", "//evil.com", "/\\evil.com", "/%09/evil.com".replace("%09", "\t"), "https://evil.com", "/\\\\evil.com"])(
    "falls back to / for %j",
    (raw) => {
      expect(safeNext(raw, origin)).toBe("/");
    },
  );
});
