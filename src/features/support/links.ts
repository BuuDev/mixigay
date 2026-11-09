// Official destinations only — the site never takes money itself (brand rules,
// docs/01-product.md). Verified 2026-11-09 against the links listed on the
// official YouTube channel @MixiGaming3con (mixigaming.com redirects there).
// Re-verify before changing; a wrong donate link is the worst bug this site can ship.

export interface OfficialLink {
  id: string;
  label: string;
  hint: string;
  href: string;
}

export const OFFICIAL_LINKS: OfficialLink[] = [
  { id: "donate", label: "Donate cho Độ", hint: "Trang donate chính thức (ZyPage)", href: "https://zypage.com/mixigaming" },
  { id: "donate-intl", label: "Donate quốc tế", hint: "Streamlabs của kênh", href: "https://streamlabs.com/mixigamingofficial/tip" },
  { id: "youtube", label: "Kênh YouTube", hint: "Xem, like, đăng ký — ủng hộ miễn phí", href: "https://www.youtube.com/@MixiGaming3con" },
  { id: "shop", label: "Shop chính chủ", hint: "shop.mixigaming.com", href: "https://shop.mixigaming.com/" },
  { id: "fanpage", label: "Fanpage", hint: "Facebook MixiGaming", href: "https://www.facebook.com/MixiGaming/" },
  { id: "discord", label: "Discord Bộ tộc", hint: "Server cộng đồng của kênh", href: "https://discord.com/invite/mixigaming" },
];
