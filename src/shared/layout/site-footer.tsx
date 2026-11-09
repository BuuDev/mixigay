import Link from "next/link";
import { OFFICIAL_CHANNEL_URL } from "../lib/links";
import { Logo } from "../ui/brand-art";

/** Brand rule: the "not official" line appears on every page. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border py-8 text-center text-sm text-muted">
      <Logo variant="mark" height={28} className="mx-auto opacity-80" />
      <p className="mt-3">
        Trang do fan tự làm, <strong className="text-foreground">không liên kết chính thức</strong> với anh Độ Mixi hay Kênh MixiGaming.
      </p>
      <p className="mt-1">
        Muốn ủng hộ? Hãy xem và ủng hộ trực tiếp trên{" "}
        <a href={OFFICIAL_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
          kênh chính chủ
        </a>
        . Trang này không nhận tiền dưới bất kỳ hình thức nào.
      </p>
      <p className="mt-1">
        <Link href="/gioi-thieu" className="underline-offset-2 hover:underline">
          Giới thiệu & liên hệ gỡ nội dung
        </Link>
      </p>
    </footer>
  );
}
