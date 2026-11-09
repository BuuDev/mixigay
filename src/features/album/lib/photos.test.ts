import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALBUM } from "./photos";

const pub = join(process.cwd(), "public");

describe("album", () => {
  it("every photo exists under public/ with an ASCII path", () => {
    for (const p of ALBUM) {
      expect(p.src).toMatch(/^\/album\/[a-z0-9-]+\.jpg$/);
      expect(existsSync(join(pub, p.src))).toBe(true);
    }
  });

  it("never names an official logo as an album photo (pixels are reviewed by a person, see photos.ts)", () => {
    for (const p of ALBUM) expect(`${p.src} ${p.alt} ${p.caption}`.toLowerCase()).not.toMatch(/logo|refund/);
  });

  it("has ids, alt text, captions and credits", () => {
    expect(new Set(ALBUM.map((p) => p.id)).size).toBe(ALBUM.length);
    for (const p of ALBUM) {
      expect(p.alt.length).toBeGreaterThan(10);
      expect(p.caption.length).toBeGreaterThan(5);
      expect(p.credit).toBeTruthy();
    }
  });
});
