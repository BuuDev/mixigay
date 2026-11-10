import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { checkImage, sanitizeImage } = await import("./game-art");

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#884422" } })
    .png()
    .toBuffer();

describe("sanitizeImage", () => {
  it("re-encodes to a 640×360 WebP without metadata", async () => {
    const input = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#123456" } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "secret-gps-owner" } }, orientation: 6 })
      .toBuffer();
    const out = await sanitizeImage(input);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const meta = await sharp(out.webp).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 640, height: 360 });
    expect(meta.exif).toBeUndefined();
    expect(out.webp.includes("secret-gps-owner")).toBe(false);
    expect(out.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(out.originalSha256).not.toBe(out.sha256);
  });

  it("is deterministic, so a banned output hash catches a re-upload", async () => {
    const input = await png(800, 600);
    const [a, b] = await Promise.all([sanitizeImage(input), sanitizeImage(input)]);
    expect(a.ok && b.ok && a.sha256 === b.sha256).toBe(true);
  });

  it("refuses non-images, animations, oversized sides and empty files", async () => {
    expect(await sanitizeImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toEqual({ ok: false, reason: "type" });
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } })
      .gif()
      .toBuffer();
    expect(await sanitizeImage(gif)).toEqual({ ok: false, reason: "type" });
    // Two different frames (the WebP encoder merges identical ones).
    const frames = await Promise.all(
      ["#112233", "#445566"].map((background) =>
        sharp({ create: { width: 10, height: 20, channels: 3, background } })
          .png()
          .toBuffer(),
      ),
    );
    const animated = await sharp(frames, { join: { animated: true } })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    expect(await sanitizeImage(animated)).toEqual({ ok: false, reason: "animated" });
    expect(await sanitizeImage(await png(8001, 2))).toEqual({ ok: false, reason: "dimensions" });
    expect(await sanitizeImage(new Uint8Array())).toEqual({ ok: false, reason: "size" });
    // PNG magic bytes followed by garbage.
    expect(await sanitizeImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]))).toEqual({ ok: false, reason: "decode" });
  });
});

describe("checkImage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("goes to manual review without an API key", async () => {
    vi.stubEnv("GOOGLE_VISION_API_KEY", "");
    expect(await checkImage(new Uint8Array([1]))).toEqual({ verdict: "review", reasons: ["chưa bật quét tự động"] });
  });

  it("maps the Vision response, and never says ok on errors", async () => {
    vi.stubEnv("GOOGLE_VISION_API_KEY", "k");
    const reply = (body: unknown, status = 200) =>
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify(body), { status })),
      );
    reply({ responses: [{ safeSearchAnnotation: { adult: "VERY_LIKELY" } }] });
    expect((await checkImage(new Uint8Array([1]))).verdict).toBe("block");
    reply({
      responses: [{ safeSearchAnnotation: { adult: "VERY_UNLIKELY", violence: "UNLIKELY", racy: "UNLIKELY" }, fullTextAnnotation: { text: "ELDEN RING" } }],
    });
    expect((await checkImage(new Uint8Array([1]))).verdict).toBe("ok");
    reply({ error: "quota" }, 429);
    expect((await checkImage(new Uint8Array([1]))).verdict).toBe("review");
    reply({ responses: [{ error: { message: "bad image" } }] });
    expect((await checkImage(new Uint8Array([1]))).verdict).toBe("review");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("ENOTFOUND"))),
    );
    expect((await checkImage(new Uint8Array([1]))).verdict).toBe("review");
  });
});
