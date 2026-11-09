// One list of destinations for the desktop header and the phone tab bar.
export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short?: string;
  /** Shown as a tab on phones; the rest go under "Thêm". */
  tab?: boolean;
  /** Shown in the desktop header; the rest go under its "Thêm" menu. */
  primary?: boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Trang chủ", tab: true, primary: true },
  { href: "/lich", label: "Lịch stream", short: "Lịch", tab: true, primary: true },
  { href: "/video", label: "Video theo game", short: "Video", tab: true, primary: true },
  { href: "/de-xuat", label: "Đề xuất game", short: "Đề xuất", tab: true, primary: true },
  { href: "/series", label: "Series" },
  { href: "/nhac", label: "Góc nhạc", primary: true },
  { href: "/bo-toc", label: "Bộ Tộc", primary: true },
  { href: "/an-xa", label: "Ân xá", short: "Ân xá" },
  { href: "/gui-anh-do", label: "Gửi anh Độ", short: "Gửi anh Độ", primary: true },
  { href: "/da-choi", label: "Đã chơi" },
  { href: "/thong-ke", label: "Thống kê" },
];

export const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
