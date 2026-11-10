import Image, { type ImageProps } from "next/image";

// YouTube already serves every thumbnail in fixed sizes from its own CDN. Sending them
// through Vercel's image optimizer cost one CDN request, one transformation (Hobby: 5,000
// a month, ~3,000 videos × several widths) and our bandwidth per image, for no gain. So
// i.ytimg.com images load directly (unoptimized); everything else keeps next/image.

const YT = /^https:\/\/i\.ytimg\.com\/vi(?:_webp)?\/([\w-]{6,20})\/[\w]+\.(?:jpg|webp)$/;

/** "mq" = 320×180 (16:9, always exists); "hq" = 480×360 (4:3, letterboxed; object-cover crops the bars). */
export type YtSize = "mq" | "hq";

/** The YouTube thumbnail URL at a fixed size, or null when `src` is not one. */
export function youtubeThumb(src: unknown, size: YtSize): string | null {
  if (typeof src !== "string") return null;
  const m = YT.exec(src);
  return m ? `https://i.ytimg.com/vi/${m[1]}/${size}default.jpg` : null;
}

/** next/image, except YouTube thumbnails come straight from i.ytimg.com. Pass `ytSize="mq"` for small slots. */
export function SmartImage({ ytSize = "hq", ...props }: ImageProps & { ytSize?: YtSize }) {
  const yt = youtubeThumb(props.src, ytSize);
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through in props
  return yt ? <Image {...props} src={yt} unoptimized /> : <Image {...props} />;
}
