import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/lib/links";

const PATHS = ["/", "/lich", "/video", "/vlog", "/da-choi", "/de-xuat", "/gioi-thieu"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
