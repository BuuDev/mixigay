import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

// Site-wide share card: the official channel banner and MixiGaming badge (ADR-016) over the night
// background, with the fan-site line so nobody mistakes it for the channel itself.
// Static: no request data, no clock, so it is prerendered at build time.

export const alt = "Góc Bộ Tộc – trang fan của Bộ Tộc: lịch live, video và đề xuất game cho anh Độ Mixi. Không phải kênh chính thức của Kênh MixiGaming.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NIGHT = "#121018";
const EMBER = "#FF6A1F";
const CREAM = "#F3E9D7";
const MUTED = "#a39cb3";

// Banner at its own ratio (2560×424); the badge only dips into its plain bottom edge, clear of the banner text.
const BANNER_HEIGHT = 200;
const BADGE = 236;
const BADGE_TOP = BANNER_HEIGHT - 28;

// Geist ships with next/og and covers the full Vietnamese range (ộ, ị, ề, ấ, ự, ế…).
// Read once at module load, as in the installed opengraph-image docs.
const geist = await readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"));

// The assets are WebP; the og renderer reliably decodes PNG/JPEG only, so convert once at module load.
async function pngDataUrl(file: string, width: number, height: number): Promise<string> {
  const png = await sharp(join(process.cwd(), "public/brand/official", file))
    .resize(width, height, { fit: "cover" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
const banner = await pngDataUrl("channel-banner.webp", size.width, BANNER_HEIGHT);
const badge = await pngDataUrl("mixigaming-badge.webp", BADGE * 2, BADGE * 2);

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: NIGHT,
        backgroundImage: "radial-gradient(circle at 20% 78%, rgba(255,106,31,0.18) 0%, rgba(18,16,24,0) 42%)",
        color: CREAM,
        fontFamily: "Geist",
      }}
    >
      <img src={banner} width={size.width} height={BANNER_HEIGHT} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: BADGE_TOP,
          width: BADGE + 16,
          height: BADGE + 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          backgroundColor: NIGHT,
        }}
      >
        <img src={badge} width={BADGE} height={BADGE} alt="" style={{ borderRadius: 9999, backgroundColor: "#ffffff" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 72 + BADGE + 16 + 44,
          right: 64,
          top: BADGE_TOP + 64,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", fontSize: 92, letterSpacing: 2, lineHeight: 1.1 }}>
          <span>Góc&nbsp;</span>
          <span style={{ color: EMBER }}>Bộ Tộc</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, lineHeight: 1.35 }}>Lịch live · video · đề xuất game cho anh Độ Mixi</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 40,
          display: "flex",
          borderTop: "2px solid rgba(243,233,215,0.16)",
          paddingTop: 20,
          fontSize: 28,
          color: MUTED,
        }}
      >
        Trang fan của Bộ Tộc · không phải kênh chính thức
      </div>
    </div>,
    { ...size, fonts: [{ name: "Geist", data: geist, style: "normal", weight: 400 }] },
  );
}
