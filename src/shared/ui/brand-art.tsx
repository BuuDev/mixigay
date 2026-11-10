import Image from "next/image";

// SVG illustrations live as static files in public/brand (generated from
// docs/design/brand.html by `npm run brand`); SVGs are served as-is (`unoptimized`)
// because the image optimizer does not process SVG.
// The logo is the official MixiGaming badge (ADR-016), public/brand/official, through the optimizer.
// Character art lives in public/art as transparent 640×640 WebP and goes through the optimizer:
//   public/art/cu-dem   — Cú Đêm, the site's own owl mascot (never a depiction of anh Độ).
//   public/art/do-mixi  — fan-made drawings of anh Độ with Cú Đêm, used only as content.
// Neither set is site identity (logo, favicon, app icons, manifest, OG image): that is the official badge.

export type MascotPose =
  | "hello"
  | "live"
  | "wait"
  | "sleep"
  | "sad"
  | "win"
  | "king"
  | "chat"
  | "notify"
  | "gaming"
  | "vod"
  | "subscribe"
  | "stage"
  | "download"
  | "esport"
  | "night"
  | "campfire";

export type IllustrationName =
  | "empty-offday"
  | "empty-suggestions"
  | "empty-videos"
  | "error-load"
  | "intro-unlit"
  | "intro-lit"
  | "countdown-hero"
  | "attend-crowd"
  | "wall-empty"
  | "giftbox-closed"
  | "giftbox-open"
  | "thumb-placeholder";

const MASCOT: Record<MascotPose, { file: string; alt: string }> = {
  hello: { file: "01-trang-chu", alt: "Cú Đêm chào Bộ Tộc trước ngôi nhà nhỏ" },
  live: { file: "02-dang-live", alt: "Cú Đêm ngồi trước máy tính, biển LIVE đang sáng" },
  king: { file: "03-toc-truong-do", alt: "Cú Đêm ngồi trên ngai vàng" },
  chat: { file: "04-phong-chat", alt: "Cú Đêm đeo tai nghe, cạnh bong bóng chat" },
  wait: { file: "06-lich-live", alt: "Cú Đêm chỉ vào lịch 22:22, đang hóng" },
  notify: { file: "07-thong-bao", alt: "Cú Đêm cầm loa thông báo, cạnh chiếc chuông" },
  gaming: { file: "09-tro-choi-game", alt: "Cú Đêm cầm tay cầm chơi game" },
  vod: { file: "10-xem-lai-vod", alt: "Cú Đêm với cuộn phim và nút phát dưới trăng" },
  subscribe: { file: "11-dang-ky-subs", alt: "Cú Đêm giơ biển SUBSCRIBE" },
  stage: { file: "12-su-kien-offline", alt: "Các bạn cú trên sân khấu dưới ánh đèn" },
  win: { file: "13-meme-giai-tri", alt: "Cú Đêm cười lăn lộn" },
  download: { file: "14-tai-nguyen-tai-ve", alt: "Cú Đêm bên hộp tải về" },
  sad: { file: "15-ung-ho-support", alt: "Cú Đêm nhắm mắt, bối rối" },
  esport: { file: "17-giai-dau-esport", alt: "Cú Đêm đội mũ đấu sĩ, ôm cúp" },
  night: { file: "18-che-do-cu-dem", alt: "Cú Đêm đeo kính râm trước vầng trăng" },
  campfire: { file: "19-cong-dong-fan", alt: "Các bạn cú quây quần bên đống lửa" },
  sleep: { file: "20-dang-xuat-di-ngu", alt: "Cú Đêm đang ngủ say" },
};

/** Public path of a mascot pose (e.g. for a service-worker precache list). */
export function mascotSrc(pose: MascotPose): string {
  return `/art/cu-dem/${MASCOT[pose].file}.webp`;
}

/** Cú Đêm — the site's original owl mascot, never a depiction of anh Độ (brand rules). */
export function Mascot({
  pose,
  size = 96,
  className,
  decorative = false,
  sizes,
  loading,
  unoptimized,
}: {
  pose: MascotPose;
  size?: number;
  className?: string;
  decorative?: boolean;
  /** Override when CSS renders the image at another size than `size` on some breakpoints. */
  sizes?: string;
  loading?: "eager" | "lazy";
  /** Only for pages that must work offline (the service worker precaches the raw file, not optimizer URLs). */
  unoptimized?: boolean;
}) {
  return (
    <Image
      src={mascotSrc(pose)}
      alt={decorative ? "" : MASCOT[pose].alt}
      width={size}
      height={size}
      sizes={sizes ?? `${size}px`}
      loading={loading}
      unoptimized={unoptimized}
      className={className}
    />
  );
}

export type Scene =
  | "01-trang-chu"
  | "02-dang-live"
  | "03-toc-truong"
  | "04-phong-chat"
  | "05-cua-hang"
  | "06-lich-live"
  | "07-thong-bao"
  | "09-tro-choi"
  | "10-xem-lai-vod"
  | "11-dang-ky"
  | "12-su-kien-offline"
  | "13-meme-giai-tri"
  | "14-tai-nguyen"
  | "15-ung-ho-support"
  | "16-bang-xep-hang"
  | "17-giai-dau-esport"
  | "18-che-do-cu-dem"
  | "19-cong-dong-bo-toc"
  | "20-di-ngu";

// Each alt says it is a fan-made drawing; none of them puts words in anh Độ's mouth.
const SCENE_ALT: Record<Scene, string> = {
  "01-trang-chu": "Tranh vẽ anh Độ và Cú Đêm vẫy chào trước ngôi nhà (fan làm)",
  "02-dang-live": "Tranh vẽ anh Độ và Cú Đêm lúc đang live (fan làm)",
  "03-toc-truong": "Tranh vẽ anh Độ ngồi trên ngai cùng Cú Đêm (fan làm)",
  "04-phong-chat": "Tranh vẽ anh Độ và Cú Đêm ở phòng chat (fan làm)",
  "05-cua-hang": "Tranh vẽ anh Độ và Cú Đêm với giỏ đồ (fan làm)",
  "06-lich-live": "Tranh vẽ anh Độ và Cú Đêm ở lịch live 22:22 (fan làm)",
  "07-thong-bao": "Tranh vẽ anh Độ và Cú Đêm cầm loa thông báo (fan làm)",
  "09-tro-choi": "Tranh vẽ anh Độ và Cú Đêm cầm tay cầm chơi game (fan làm)",
  "10-xem-lai-vod": "Tranh vẽ anh Độ và Cú Đêm bên cửa sổ đêm (fan làm)",
  "11-dang-ky": "Tranh vẽ anh Độ và Cú Đêm giơ biển SUBSCRIBE (fan làm)",
  "12-su-kien-offline": "Tranh vẽ anh Độ cầm mic trên sân khấu cùng Cú Đêm (fan làm)",
  "13-meme-giai-tri": "Tranh vẽ anh Độ và Cú Đêm cười vui (fan làm)",
  "14-tai-nguyen": "Tranh vẽ anh Độ và Cú Đêm bên hộp tải về (fan làm)",
  "15-ung-ho-support": "Tranh vẽ anh Độ đặt tay lên ngực cùng Cú Đêm (fan làm)",
  "16-bang-xep-hang": "Tranh vẽ anh Độ trên bục số 1 cùng Cú Đêm (fan làm)",
  "17-giai-dau-esport": "Tranh vẽ anh Độ cầm cúp cùng Cú Đêm (fan làm)",
  "18-che-do-cu-dem": "Tranh vẽ anh Độ đeo kính râm trước vầng trăng cùng Cú Đêm (fan làm)",
  "19-cong-dong-bo-toc": "Tranh vẽ anh Độ và các bạn cú quây quần bên lửa trại (fan làm)",
  "20-di-ngu": "Tranh vẽ anh Độ và Cú Đêm đang ngủ (fan làm)",
};

/**
 * Fan-made drawing of anh Độ with Cú Đêm. Content illustration only (page headers,
 * empty states, section art): never the logo, an icon or a share image.
 */
export function SceneArt({
  scene,
  size = 160,
  className,
  decorative = false,
  alt,
  sizes,
}: {
  scene: Scene;
  size?: number;
  className?: string;
  decorative?: boolean;
  alt?: string;
  /** Override when CSS renders the image at another size than `size` on some breakpoints. */
  sizes?: string;
}) {
  return (
    <Image
      src={`/art/do-mixi/${scene}.webp`}
      alt={decorative ? "" : (alt ?? SCENE_ALT[scene])}
      width={size}
      height={size}
      sizes={sizes ?? `${size}px`}
      className={className}
    />
  );
}

export function Illustration({ name, width = 240, className, alt = "" }: { name: IllustrationName; width?: number; className?: string; alt?: string }) {
  const ratio = name === "thumb-placeholder" ? 180 / 320 : 160 / 240;
  return <Image src={`/brand/illustrations/${name}.svg`} alt={alt} width={width} height={Math.round(width * ratio)} unoptimized className={className} />;
}

// 96 px copy (3 KB) served as-is: the service worker precaches it, so /offline keeps its logo.
const BADGE_SRC = "/brand/official/mixigaming-badge-96.webp";
const LOGO_ALT = "Góc Bộ Tộc – MixiGaming";

/**
 * Official MixiGaming badge (ADR-016) + "GÓC BỘ TỘC" set in the site font (header), or the badge alone.
 * The logo is black line art on its own white disc: never render it without the disc on the dark page.
 */
export function Logo({
  variant = "full",
  tone = "dark",
  height = 32,
  className,
}: {
  variant?: "full" | "mark";
  tone?: "dark" | "mono-white";
  height?: number;
  className?: string;
}) {
  const badge = (
    <Image
      src={BADGE_SRC}
      alt={LOGO_ALT}
      width={height}
      height={height}
      unoptimized
      // The header badge is above the fold on every page; the mark (footer) can wait.
      // `priority` is deprecated in Next 16 and `preload` is meant for the LCP image only.
      loading={variant === "full" ? "eager" : "lazy"}
      className={`shrink-0 rounded-full bg-white ${variant === "mark" ? (className ?? "") : ""}`}
    />
  );
  if (variant === "mark") return badge;
  // `className` sets the display (e.g. "hidden sm:flex"); the gap/alignment are fixed here.
  // The visible name follows the badge, so the badge alt only adds "MixiGaming" for screen readers.
  return (
    <span className={`items-center gap-2 ${className ?? "inline-flex"}`}>
      {badge}
      <span
        className={`leading-none font-black tracking-[0.12em] whitespace-nowrap ${tone === "mono-white" ? "text-white" : "text-foreground"}`}
        style={{ fontSize: Math.round(height * 0.55) }}
      >
        GÓC <span className="text-accent">BỘ TỘC</span>
      </span>
    </span>
  );
}
