import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "shared.akamai.steamstatic.com" },
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "shared.fastly.steamstatic.com" },
      // Fan song covers (fan_songs.thumbnail_url CHECK pins the same hosts). Listed one by one:
      // "*.sndcdn.com" would also allow SoundCloud's other CDNs.
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ protocol: "https" as const, hostname: `i${n}.sndcdn.com` })),
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com" },
      { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com" },
    ],
  },
  // Invite links carry a one-time token in the path: never leak it through Referer.
  async headers() {
    return [
      { source: "/moi/:token*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      // Background radio files (~1–2 MB each): cache a week so repeat visits don't re-download.
      { source: "/music/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      // Service worker (PWA guide): always re-fetched so a new version rolls out, same-origin only.
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
