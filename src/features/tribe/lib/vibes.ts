// Short, self-deprecating observations from the fan community ("giọng Bộ Tộc")
// inspired by the channel's recent 1–2 months of streams. Never phrased as a
// quote of Độ himself (spec §12 / fan-site-guard).

export interface TribeVibeItem {
  id: string;
  tag: string;
  text: string;
  context: string;
}

export const TRIBE_VIBES: readonly TribeVibeItem[] = [
  {
    id: "harmonica",
    tag: "Delta Force",
    text: "Hôm nay anh em vào stream không hỏi ăn cơm chưa, chỉ hỏi đã nhặt được kèn Harmonica và lời hay lỗ ở phòng Giám đốc.",
    context: "Chuỗi ngày săn kèn Harmonica & Ao làng DF",
  },
  {
    id: "nene-shop",
    tag: "Ông chủ Moi",
    text: "Khách vào NeNe Shop Yên Lãng mua túi mù thì ít, mà xem ông chủ tất tay xé hộp tìm Secret thì nhiều.",
    context: "Blind Box Shop Simulator",
  },
  {
    id: "stream-escape",
    tag: "Game Bộ Tộc làm",
    text: "Tiêu đề hứa “giải đố độ khó thiếu nhi” — Bộ Tộc lâu năm thì biết chữ “thiếu nhi” trên sóng chưa bao giờ đơn giản.",
    context: "Mixi Stream Escape 3 & game leo tháp",
  },
  {
    id: "du-an-ma",
    tag: "Dự án ma",
    text: "Live tới 2 giờ sáng là kiểu gì cũng có thêm một “dự án ma” được vẽ ra — Bộ Tộc chỉ việc ghi vào sổ, còn làm hay không thì… để sau.",
    context: "Meme “dự án ma” & buổi stream “miệt mài vẽ dự án ma”",
  },
  {
    id: "an-lieng",
    tag: "Phòng Trà An Liễng",
    text: "Từ giải đấu Moi Xoang trở lại tới đêm nhạc “dát vàng lỗ tai” — kênh game nhưng tâm hồn thì đầy ca nhạc.",
    context: "Phòng Trà An Liễng #4 & siêu phẩm nà ná na na",
  },
  {
    id: "tetris-rex",
    tag: "Phong trào Discord",
    text: "Ban ngày hẹn bắn súng chiến thuật, tối lên sóng lại thấy cả Discord Bộ Tộc căng não xếp gạch Tetris và hóa khủng long T-Rex 20vs20.",
    context: "Giải Tetris Discord & The Isle",
  },
  {
    id: "canh-gio",
    tag: "Khung giờ 22:22",
    text: "22:20 đã nấu xong mì tôm, pha sẵn trà đá, điện thoại sạc đầy. Giờ chỉ còn ngồi chờ đúng 22:22.",
    context: "Nghi thức thức đêm của Bộ Tộc",
  },
];

/** Deterministic initial index from a Vietnam date key (or 0) so SSR and hydration match. */
export function vibeIndexForDay(dayIndex: number, total = TRIBE_VIBES.length): number {
  if (total <= 0) return 0;
  return ((dayIndex % total) + total) % total;
}

/** Advances to the next vibe index, wrapping around. */
export function nextVibeIndex(current: number, total = TRIBE_VIBES.length): number {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

