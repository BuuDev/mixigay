// One list of destinations for the desktop header and the phone tab bar.
export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short?: string;
  /** Shown as a tab on phones; the rest go under "Thêm". */
  tab?: boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Trang chủ", tab: true },
  { href: "/lich", label: "Lịch stream", short: "Lịch", tab: true },
  { href: "/video", label: "Video theo game", short: "Video", tab: true },
  { href: "/de-xuat", label: "Đề xuất game", short: "Đề xuất", tab: true },
  { href: "/series", label: "Series" },
  { href: "/nhac", label: "Góc nhạc" },
  { href: "/bo-toc", label: "Bộ Tộc" },
  { href: "/an-xa", label: "Ân xá", short: "Ân xá" },
  { href: "/da-choi", label: "Đã chơi" },
];

export const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
