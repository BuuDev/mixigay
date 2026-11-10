import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/lib/links";

const PATHS = [
  "/",
  "/lich",
  "/video",
  "/vlog",
  "/series",
  "/nhac",
  "/bo-toc",
  "/an-xa",
  "/gui-anh-do",
  "/da-choi",
  "/de-xuat",
  "/gioi-thieu",
  "/kho-quote",
  "/giai-dau",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
