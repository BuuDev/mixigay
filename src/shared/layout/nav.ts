// One list of destinations for the desktop header and the phone tab bar.
export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar and the desktop header below xl. */
  short?: string;
  /** Shown as a tab on phones; the rest go under "Thêm". */
  tab?: boolean;
  /** Always shown in the desktop header (6 items: fits next to admin + long name at 1024 px). */
  primary?: boolean;
  /** Desktop "Thêm" menu: which column, and a one-line hint. */
  group?: "watch" | "tribe";
  desc?: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Trang chủ", tab: true, primary: true },
  { href: "/lich", label: "Lịch stream", short: "Lịch", tab: true, primary: true },
  { href: "/video", label: "Video theo game", short: "Video", tab: true, primary: true },
  { href: "/de-xuat", label: "Đề xuất game", short: "Đề xuất", tab: true, primary: true },
  { href: "/bo-toc", label: "Bộ Tộc", primary: true },
  { href: "/gui-anh-do", label: "Gửi anh Độ", short: "Gửi anh Độ", primary: true },
  { href: "/nhac", label: "Góc nhạc", group: "watch", desc: "Phòng Trà An Liễng, nhạc nịnh" },
  { href: "/series", label: "Series", group: "watch", desc: "Các series theo tập" },
  { href: "/da-choi", label: "Đã chơi", group: "watch", desc: "Game anh Độ đã phá đảo, đang chơi" },
  { href: "/giai-dau", label: "Giải đấu", group: "watch", desc: "Ao Làng, Moi Xoang, Tetris" },
  { href: "/kho-quote", label: "Kho quote", group: "tribe", desc: "Câu nói đáng nhớ kèm mốc giờ" },
  { href: "/an-xa", label: "Ân xá", short: "Ân xá", group: "tribe", desc: "Tòa án hối lỗi xin unban" },
];

/** Desktop "Thêm" menu columns. */
export const MORE_GROUPS: { key: "watch" | "tribe"; title: string }[] = [
  { key: "watch", title: "Xem & nghe" },
  { key: "tribe", title: "Bộ Tộc góp" },
];

export const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
