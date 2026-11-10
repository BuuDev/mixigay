import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mascotSrc, type MascotPose, type Scene } from "./brand-art";

// Every pose/scene the code can render must exist in public/ (a typo would ship a broken image).
const POSES: MascotPose[] = [
  "hello",
  "live",
  "wait",
  "sleep",
  "sad",
  "win",
  "king",
  "chat",
  "notify",
  "gaming",
  "vod",
  "subscribe",
  "stage",
  "download",
  "esport",
  "night",
  "campfire",
];
const SCENES: Scene[] = [
  "01-trang-chu",
  "02-dang-live",
  "03-toc-truong",
  "04-phong-chat",
  "05-cua-hang",
  "06-lich-live",
  "07-thong-bao",
  "09-tro-choi",
  "10-xem-lai-vod",
  "11-dang-ky",
  "12-su-kien-offline",
  "13-meme-giai-tri",
  "14-tai-nguyen",
  "15-ung-ho-support",
  "16-bang-xep-hang",
  "17-giai-dau-esport",
  "18-che-do-cu-dem",
  "19-cong-dong-bo-toc",
  "20-di-ngu",
];
const pub = (src: string) => join(process.cwd(), "public", src);

describe("brand art files", () => {
  it.each(POSES)("mascot pose %s exists", (pose) => {
    expect(existsSync(pub(mascotSrc(pose)))).toBe(true);
  });
  it.each(SCENES)("scene %s exists", (scene) => {
    expect(existsSync(pub(`/art/do-mixi/${scene}.webp`))).toBe(true);
  });
  it("excluded artwork (LEGO, donation scenes) is not shipped", () => {
    for (const f of [
      "/art/cu-dem/05-cua-hang-mixishop.webp",
      "/art/cu-dem/08-quyen-gop-donate.webp",
      "/art/cu-dem/16-xep-hang-top-donate.webp",
      "/art/do-mixi/08-quyen-gop.webp",
    ]) {
      expect(existsSync(pub(f))).toBe(false);
    }
  });
});
