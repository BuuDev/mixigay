import type { MetadataRoute } from "next";

// Web app manifest (served as /manifest.webmanifest). The service worker (public/sw.js) only provides the offline page.
// Icons are the official MixiGaming face on a white square (ADR-016), static files in public/brand/official.
// "any" uses the full face; "maskable" is a padded copy (face within the 80% safe circle) so Android masks never clip the hair.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Góc Bộ Tộc – web fan anh Độ Mixi",
    short_name: "Góc Bộ Tộc",
    description: "Web fan tự làm: lịch live, video và đề xuất game cho anh Độ Mixi. Không liên kết chính thức với Kênh MixiGaming.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#121018",
    theme_color: "#121018",
    lang: "vi",
    dir: "ltr",
    categories: ["entertainment"],
    icons: [
      { src: "/brand/official/face-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/official/face-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/official/face-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/official/face-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
