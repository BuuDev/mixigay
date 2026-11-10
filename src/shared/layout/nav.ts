// One list of destinations for the desktop header, the phone tab bar and the footer.
// Order matters: fan-contribution pages come right after "Trang chủ" everywhere.
export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the desktop header below 2xl. */
  short?: string;
  /** Label in the phone tab bar (falls back to `short`, then `label`). */
  tabLabel?: string;
  /** Shown as a tab on phones; the rest go into the tab bar's "Thêm" sheet. */
  tab?: boolean;
  /**
   * Fixed link in the desktop header. "lg" = from 1024 px; "xl" = only from 1280 px, and
   * inside the "Thêm" menu between 1024 and 1279 px (pure CSS, see site-header.tsx).
   */
  primary?: "lg" | "xl";
  /** A page where the Bộ Tộc sends something in: gets the accent "+" treatment. */
  contribute?: boolean;
  /** Desktop "Thêm" menu: which column, and a one-line hint. */
  group?: "watch" | "tribe";
  desc?: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Trang chủ", tab: true, primary: "lg" },
  { href: "/de-xuat", label: "Đề xuất game", short: "Đề xuất", tab: true, primary: "lg", contribute: true },
  { href: "/nhac", label: "Gửi nhạc", tabLabel: "Nhạc", tab: true, primary: "lg", contribute: true },
  { href: "/quiz", label: "Quiz", tab: true, primary: "lg", contribute: true },
  { href: "/an-xa", label: "Ân xá", primary: "lg", contribute: true },
  { href: "/bo-toc", label: "Bộ Tộc", primary: "xl", group: "tribe", desc: "Bức tường, fan art, từ điển Bộ Tộc" },
  { href: "/lich", label: "Lịch stream", short: "Lịch", primary: "xl", group: "watch", desc: "Lịch live sắp tới" },
  { href: "/video", label: "Video theo game", group: "watch", desc: "Tìm lại video theo từng game" },
  { href: "/series", label: "Series", group: "watch", desc: "Các series theo tập" },
  { href: "/da-choi", label: "Đã chơi", group: "watch", desc: "Game anh Độ đã phá đảo, đang chơi" },
  { href: "/giai-dau", label: "Giải đấu", group: "watch", desc: "Ao Làng, Moi Xoang, Tetris" },
  { href: "/kho-quote", label: "Kho quote", group: "tribe", desc: "Câu nói đáng nhớ kèm mốc giờ" },
  { href: "/gui-anh-do", label: "Gửi anh Độ", group: "tribe", desc: "Lời nhắn của Bộ Tộc gửi anh Độ" },
  { href: "/gioi-thieu", label: "Giới thiệu", group: "tribe", desc: "Trang này là gì, liên hệ gỡ nội dung" },
];

/** Desktop "Thêm" menu columns. */
export const MORE_GROUPS: { key: "watch" | "tribe"; title: string }[] = [
  { key: "watch", title: "Xem & nghe" },
  { key: "tribe", title: "Bộ Tộc góp" },
];

export const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
