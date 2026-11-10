import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Site-wide share card. Brand rule: only the campfire mark (public/brand/logomark.svg),
// never channel logos, channel art or photos of real people.
// Static: no request data, no clock, so it is prerendered at build time.

export const alt = "Góc Bộ Tộc – web fan tự làm: lịch live, video và đề xuất game cho anh Độ Mixi. Không liên kết chính thức với Kênh MixiGaming.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NIGHT = "#121018";
const EMBER = "#FF6A1F";
const CREAM = "#F3E9D7";
const MUTED = "#a39cb3";

// Geist ships with next/og and covers the full Vietnamese range (ộ, ị, ề, ấ, ự, ế…).
// Read once at module load, as in the installed opengraph-image docs.
const geist = await readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"));

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px 80px 56px",
          backgroundColor: NIGHT,
          backgroundImage: "radial-gradient(circle at 18% 42%, rgba(255,106,31,0.22) 0%, rgba(18,16,24,0) 46%)",
          color: CREAM,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
          <svg width="240" height="240" viewBox="0 0 64 64">
            <path
              d="M33 3 C 34 11, 42.5 15.5, 46 23.5 C 49 30.5, 48.5 38.5, 45 44.5 C 41.8 50.5, 36.8 54, 32 55 C 27.2 54, 22.2 50.5, 19 44.5 C 15 36.5, 16.5 28.5, 21 22 C 22.5 19.8, 24 17.6, 24 14.5 C 27.5 17, 29.5 20.5, 29 25 C 33 20, 34 11, 33 3 Z M32 29 C 29 34, 25.5 38, 26.5 43.5 C 27.2 47.5, 29.5 50, 32 50.5 C 34.5 50, 36.8 47.5, 37.5 43.5 C 38.5 38, 35 34, 32 29 Z"
              fill={EMBER}
              fillRule="evenodd"
            />
            <path d="M14 60.5 L 50 54.5 M14 54.5 L 50 60.5" stroke={CREAM} strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 104, letterSpacing: 4, lineHeight: 1.1 }}>
              <span>GÓC&nbsp;</span>
              <span style={{ color: EMBER }}>BỘ TỘC</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 38, lineHeight: 1.35 }}>
              <span>Lịch live · video · đề xuất game</span>
              <span>cho anh Độ Mixi</span>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            borderTop: "2px solid rgba(243,233,215,0.16)",
            paddingTop: 24,
            fontSize: 28,
            color: MUTED,
          }}
        >
          Web fan tự làm – không liên kết chính thức với Kênh MixiGaming
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Geist", data: geist, style: "normal", weight: 400 }] },
  );
}
