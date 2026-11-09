import Image from "next/image";

// Brand artwork lives as static SVG files in public/brand (generated from
// docs/design/brand.html by `npm run brand`), so it costs no JavaScript.
// SVGs are served as-is (`unoptimized`): the image optimizer does not process SVG.

export type MascotPose = "hello" | "live" | "wait" | "sleep" | "sad" | "win";
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

const MASCOT_ALT: Record<MascotPose, string> = {
  hello: "Cú Tộc chào Bộ Tộc",
  live: "Cú Tộc đang xem live",
  wait: "Cú Tộc đang hóng",
  sleep: "Cú Tộc đang ngủ",
  sad: "Cú Tộc buồn",
  win: "Cú Tộc ăn mừng",
};

/** The site's original mascot — never a depiction of Độ (brand rules). */
export function Mascot({ pose, size = 96, className, decorative = false }: { pose: MascotPose; size?: number; className?: string; decorative?: boolean }) {
  return (
    <Image src={`/brand/mascot/cu-toc-${pose}.svg`} alt={decorative ? "" : MASCOT_ALT[pose]} width={size} height={size} unoptimized className={className} />
  );
}

export function Illustration({ name, width = 240, className, alt = "" }: { name: IllustrationName; width?: number; className?: string; alt?: string }) {
  const ratio = name === "thumb-placeholder" ? 180 / 320 : 160 / 240;
  return <Image src={`/brand/illustrations/${name}.svg`} alt={alt} width={width} height={Math.round(width * ratio)} unoptimized className={className} />;
}

/** Campfire mark + "GÓC BỘ TỘC" set in the site font (header), or the mark alone (footer, small spaces). */
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
  if (variant === "mark") {
    return <Image src="/brand/logomark.svg" alt="Góc Bộ Tộc" width={height} height={height} unoptimized priority className={className} />;
  }
  // `className` sets the display (e.g. "hidden sm:flex"); the gap/alignment are fixed here.
  return (
    <span className={`items-center gap-2 ${className ?? "inline-flex"}`}>
      <Image src="/brand/logomark.svg" alt="" width={height} height={height} unoptimized priority />
      <span
        className={`leading-none font-black tracking-[0.12em] whitespace-nowrap ${tone === "mono-white" ? "text-white" : "text-foreground"}`}
        style={{ fontSize: Math.round(height * 0.55) }}
      >
        GÓC <span className="text-accent">BỘ TỘC</span>
      </span>
    </span>
  );
}
