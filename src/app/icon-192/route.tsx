import { ImageResponse } from "next/og";

// PWA icon 192×192 for app/manifest.ts: the campfire mark on the night background.
// The mark spans 60% of the square, inside the maskable safe zone (centre circle, 80%),
// so the same file serves both "any" and "maskable". Static: prerendered at build time.

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#121018" }}>
        <svg width="115" height="115" viewBox="0 0 64 64">
          <path
            d="M33 3 C 34 11, 42.5 15.5, 46 23.5 C 49 30.5, 48.5 38.5, 45 44.5 C 41.8 50.5, 36.8 54, 32 55 C 27.2 54, 22.2 50.5, 19 44.5 C 15 36.5, 16.5 28.5, 21 22 C 22.5 19.8, 24 17.6, 24 14.5 C 27.5 17, 29.5 20.5, 29 25 C 33 20, 34 11, 33 3 Z M32 29 C 29 34, 25.5 38, 26.5 43.5 C 27.2 47.5, 29.5 50, 32 50.5 C 34.5 50, 36.8 47.5, 37.5 43.5 C 38.5 38, 35 34, 32 29 Z"
            fill="#FF6A1F"
            fillRule="evenodd"
          />
          <path d="M14 60.5 L 50 54.5 M14 54.5 L 50 60.5" stroke="#F3E9D7" strokeWidth="5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
