import { describe, expect, it } from "vitest";
import { isArtPath, isSteamArtUrl, judgeSafeSearch, MAX_UPLOAD_BYTES, parseThumbnailReview, publicArtUrl, sniffImageType, storagePath } from "./image-policy";

const bytes = (...b: number[]) => new Uint8Array(b);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const UUID = "0b6f3c1e-2d4a-4e8b-9c7d-1a2b3c4d5e6f";

describe("sniffImageType", () => {
  it("recognises JPEG, PNG and WebP by magic bytes", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe("image/jpeg");
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("image/png");
    expect(sniffImageType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP"), ...ascii("VP8 ")))).toBe("image/webp");
  });

  it("rejects everything else, whatever the file claims to be", () => {
    expect(sniffImageType(bytes(...ascii("GIF89a")))).toBeUndefined();
    expect(sniffImageType(bytes(...ascii("<svg xmlns=")))).toBeUndefined();
    expect(sniffImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE")))).toBeUndefined();
    expect(sniffImageType(bytes(0xff, 0xd8))).toBeUndefined();
    expect(sniffImageType(bytes())).toBeUndefined();
  });

  it("caps uploads at 3 MB", () => expect(MAX_UPLOAD_BYTES).toBe(3 * 1024 * 1024));
});

describe("storage paths and URLs", () => {
  it("builds a path only from a uuid", () => {
    expect(storagePath(UUID.toUpperCase())).toBe(`suggestions/${UUID}.webp`);
    expect(() => storagePath("../x")).toThrow();
    expect(isArtPath(storagePath(UUID))).toBe(true);
    expect(isArtPath("suggestions/../x.webp")).toBe(false);
    expect(isArtPath(null)).toBe(false);
  });

  it("builds the public URL from the project URL", () => {
    expect(publicArtUrl("https://abc.supabase.co/", `suggestions/${UUID}.webp`)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/game-art/suggestions/${UUID}.webp`,
    );
    expect(publicArtUrl("", `suggestions/${UUID}.webp`)).toBeUndefined();
    expect(publicArtUrl("not a url", `suggestions/${UUID}.webp`)).toBeUndefined();
    expect(publicArtUrl("javascript:alert(1)", `suggestions/${UUID}.webp`)).toBeUndefined();
    expect(publicArtUrl("https://abc.supabase.co", "other/x.webp")).toBeUndefined();
  });

  it("mirrors only from the Steam CDN over https", () => {
    expect(isSteamArtUrl("https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570/header.jpg")).toBe(true);
    expect(isSteamArtUrl("http://shared.akamai.steamstatic.com/x.jpg")).toBe(false);
    expect(isSteamArtUrl("https://shared.akamai.steamstatic.com.evil.example/x.jpg")).toBe(false);
    expect(isSteamArtUrl("https://user@cdn.akamai.steamstatic.com/x.jpg")).toBe(false);
    expect(isSteamArtUrl("https://cdn.akamai.steamstatic.com:8443/x.jpg")).toBe(false);
    expect(isSteamArtUrl(undefined)).toBe(false);
  });
});

describe("judgeSafeSearch", () => {
  const clean = { adult: "VERY_UNLIKELY", violence: "UNLIKELY", racy: "VERY_UNLIKELY", spoof: "LIKELY", medical: "VERY_LIKELY" } as const;

  it("passes a clean image (spoof/medical do not count)", () => expect(judgeSafeSearch(clean, "")).toEqual({ verdict: "ok", reasons: [] }));

  it.each(["adult", "violence", "racy"] as const)("blocks LIKELY / VERY_LIKELY %s", (key) => {
    expect(judgeSafeSearch({ ...clean, [key]: "LIKELY" }).verdict).toBe("block");
    expect(judgeSafeSearch({ ...clean, [key]: "VERY_LIKELY" }).verdict).toBe("block");
  });

  it("sends POSSIBLE to review", () => {
    const j = judgeSafeSearch({ ...clean, racy: "POSSIBLE" });
    expect(j.verdict).toBe("review");
    expect(j.reasons).toHaveLength(1);
  });

  it("block wins over review", () => expect(judgeSafeSearch({ ...clean, racy: "POSSIBLE", adult: "LIKELY" }).verdict).toBe("block"));

  it("screens text found in the image", () => {
    expect(judgeSafeSearch(clean, "Vào nhacai88 nhận 88k").verdict).toBe("block");
    expect(judgeSafeSearch(clean, "nạp tiền hoàn trả 10%").verdict).toBe("review");
    expect(judgeSafeSearch(clean, "GAME OF THE YEAR").verdict).toBe("ok");
    expect(judgeSafeSearch({ ...clean, racy: "POSSIBLE" }, "sunwin đổi thưởng").verdict).toBe("block");
  });

  it("never says ok without an annotation", () => {
    expect(judgeSafeSearch(undefined).verdict).toBe("review");
    expect(judgeSafeSearch(null, "").verdict).toBe("review");
  });
});

describe("parseThumbnailReview", () => {
  const good = { verdict: "review", source: "upload", sha256: "a".repeat(64), originalSha256: "b".repeat(64), reasons: ["x", 1] };

  it("keeps a well-formed review and drops non-string reasons", () => {
    expect(parseThumbnailReview(good)).toEqual({ ...good, reasons: ["x"] });
  });

  it("drops malformed jsonb", () => {
    for (const junk of [
      null,
      "x",
      [],
      { ...good, verdict: "maybe" },
      { ...good, source: "drive" },
      { ...good, sha256: "zz" },
      { ...good, originalSha256: 1 },
    ]) {
      expect(parseThumbnailReview(junk)).toBeUndefined();
    }
  });
});
