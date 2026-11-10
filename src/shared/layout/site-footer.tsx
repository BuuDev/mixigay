import Link from "next/link";
import type { ComponentType } from "react";
import {
  OFFICIAL_CHANNEL_URL,
  OFFICIAL_DISCORD_URL,
  OFFICIAL_DONATE_URL,
  OFFICIAL_FANPAGE_URL,
  OFFICIAL_GROUP_URL,
  OFFICIAL_SHOP_URL,
  OFFICIAL_STREAMLABS_URL,
} from "../lib/links";
import { Logo } from "../ui/brand-art";
import { IconDiscord, IconExternal, IconFacebook, IconKindle, IconShop, IconYoutube, type IconProps } from "../ui/icons";
import { NAV } from "./nav";

// Same order as the header: contribution pages first.
const EXPLORE = NAV.map(({ href, label }) => ({ href, label }));

// Official destinations only (ADR-016): link out, the site never takes money itself.
const OFFICIAL: { href: string; label: string; Icon: ComponentType<IconProps> }[] = [
  { href: OFFICIAL_CHANNEL_URL, label: "YouTube @MixiGaming3con", Icon: IconYoutube },
  { href: OFFICIAL_FANPAGE_URL, label: "Fanpage MixiGaming", Icon: IconFacebook },
  { href: OFFICIAL_GROUP_URL, label: "Group Facebook Bộ Tộc", Icon: IconFacebook },
  { href: OFFICIAL_DISCORD_URL, label: "Discord Bộ Tộc", Icon: IconDiscord },
  { href: OFFICIAL_SHOP_URL, label: "Shop chính chủ", Icon: IconShop },
  { href: OFFICIAL_DONATE_URL, label: "Donate chính chủ (ZyPage)", Icon: IconKindle },
  { href: OFFICIAL_STREAMLABS_URL, label: "Donate quốc tế (Streamlabs)", Icon: IconExternal },
];

const linkClass = "inline-flex min-h-7 items-center gap-2 rounded-sm text-muted transition-colors duration-150 hover:text-foreground";

/**
 * Brand rule: the "not official" line appears on every page.
 * Bottom padding keeps the content above the phone tab bar, the radio player and the live dock.
 */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border px-safe pt-10 pb-[calc(9rem+env(safe-area-inset-bottom))] text-sm text-muted lg:pb-24">
      <div className="mx-auto grid max-w-7xl gap-8 2xl:max-w-[88rem] sm:grid-cols-2 lg:grid-cols-[1.2fr_1.4fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo height={32} />
          <p className="mt-3 max-w-xs leading-relaxed">Góc nhỏ Bộ Tộc tự dựng: lịch stream, video theo game, đề xuất game và kỷ niệm cùng anh Độ Mixi.</p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="font-bold text-foreground">
            Khám phá
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link prefetch={false} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-bold text-foreground">Kênh chính chủ</h2>
          <ul className="mt-3 space-y-1">
            {OFFICIAL.map(({ href, label, Icon }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <Icon size={18} className="shrink-0 text-accent" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl space-y-1 2xl:max-w-[88rem] border-t border-border pt-6 text-center">
        <p>
          Trang do fan tự làm, <strong className="text-foreground">không liên kết chính thức</strong> với anh Độ Mixi hay Kênh MixiGaming.
        </p>
        <p>
          Muốn ủng hộ? Hãy xem và ủng hộ trực tiếp trên{" "}
          <a href={OFFICIAL_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
            kênh chính chủ
          </a>
          . Trang này không nhận tiền dưới bất kỳ hình thức nào.
        </p>
        <p>
          <Link prefetch={false} href="/gioi-thieu" className="underline underline-offset-2 hover:text-foreground">
            Giới thiệu & liên hệ gỡ nội dung
          </Link>
        </p>
      </div>
    </footer>
  );
}
