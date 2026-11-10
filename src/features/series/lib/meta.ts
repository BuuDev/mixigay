// Editorial blurbs for series that are trending (wording taken from the
// channel's own episode titles, checked 2026-11-09). Unknown series still show,
// just without a blurb.

export type SeriesKind = "music" | "game" | "business" | "vlog" | "fan-game" | "party";

export const SERIES_META: Record<string, { kind: SeriesKind; blurb: string }> = {
  "phong-tra-an-lieng": { kind: "music", blurb: "Đêm nhạc An Liễng: anh Độ cùng dàn khách mời “dát vàng lỗ tai” Bộ Tộc." },
  "garena-delta-force": { kind: "game", blurb: "Delta Force cùng anh em, nhiệm vụ kèn Harmonica và các giải Ao Làng." },
  "gta-v-2026": { kind: "game", blurb: "Tam tấu Mù, Mùi, Mùng bày mưu làm giàu ở thành phố GTA." },
  "blind-box-shop-simulator": { kind: "business", blurb: "Ông chủ Moi mở NeNe Shop túi mù và vòng xoáy giàu nghèo." },
  "japanese-ramen-simulator": { kind: "business", blurb: "Tổ đội RF kinh doanh mì Ramen, kèm poster “khó đỡ” từ anh Độ." },
  "used-cars-simulator": { kind: "business", blurb: "Gara xe cũ của ông chủ Moi, từ phục hồi kinh tế tới… lỗ hổng." },
  "probably-stolen": { kind: "business", blurb: "Mở tạp hóa ở thành phố ngầm, từng bước vào thị trường đen." },
  "business-tour": { kind: "party", blurb: "Cờ tỷ phú cùng anh em, kèo Teppanyaki và “lệnh ảo ma”." },
  "mixi-stream-escape": { kind: "fan-game", blurb: "Game “trốn stream” — loạt thử thách do Bộ Tộc nghĩ ra." },
  "goose-goose-duck": { kind: "party", blurb: "Ngỗng – vịt – chim ác là: suy luận và phán đâu trúng đó." },
  "do-di-date": { kind: "vlog", blurb: "Bố Độ dắt các “nghịch tử” đi ăn — vlog đời thường." },
  dailyvlog: { kind: "vlog", blurb: "Vlog cùng anh em Refund: ẩm thực và chuyện ngoài stream." },
  "phantom-blade-zero": { kind: "game", blurb: "Phùng đại nhân bước vào thế giới kiếm hiệp." },
  "scum-2026": { kind: "game", blurb: "Chủ tịch Phùng giả nghèo giữa vùng đất zombie." },
};

export const KIND_LABEL: Record<SeriesKind, string> = {
  music: "Âm nhạc",
  game: "Game",
  business: "Giả lập kinh doanh",
  vlog: "Vlog",
  "fan-game": "Game Bộ Tộc",
  party: "Game nhóm",
};
