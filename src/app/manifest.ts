import type { MetadataRoute } from "next";

// Web app manifest (served as /manifest.webmanifest). No service worker: install only.
// Icons are the campfire mark from ./icon-192 and ./icon-512 (route handlers, static).

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
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
