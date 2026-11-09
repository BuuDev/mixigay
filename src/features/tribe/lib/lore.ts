// "Từ điển Bộ Tộc": the words, nicknames and in-jokes a newcomer meets on
// stream, grouped like a deck. Playful, affectionate nicknames are welcome (the
// project owner's call: Độ takes them in good humour); every entry still carries
// a source so the site never invents a nickname or a quote (verified 2026-11-09).

export type LoreGroup = "basics" | "personas" | "memes" | "crew" | "happenings";

export const LORE_GROUPS: { id: LoreGroup; label: string }[] = [
  { id: "basics", label: "Nhập môn" },
  { id: "personas", label: "Đa nhân cách" },
  { id: "memes", label: "Meme bất hủ" },
  { id: "crew", label: "Hội anh em" },
  { id: "happenings", label: "Sự vụ 10–11/2026" },
];

export interface LoreEntry {
  term: string;
  group: LoreGroup;
  meaning: string;
  source: { label: string; href: string };
  unverified?: boolean;
}

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const DESCRIPTION_SOURCE = { label: "Mô tả video chính chủ", href: yt("PoFdB4XcLe8") };
const GAMEK_NICKNAMES = {
  label: "Gamek: các biệt danh của anh Độ Mixi (24/08/2021)",
  href: "https://gamek.vn/la-fan-cua-do-mixi-ban-co-liet-ke-duoc-nhung-biet-danh-thu-vi-nay-cua-nam-streamer-20210824215644596.chn",
};

export const LORE: LoreEntry[] = [
  // ----- Nhập môn
  {
    term: "Tộc Trưởng",
    group: "basics",
    meaning: "Biệt danh phổ biến nhất của anh Độ — “thủ lĩnh” của Bộ Tộc, cũng gắn với gốc dân tộc Tày của anh.",
    source: GAMEK_NICKNAMES,
  },
  {
    term: "Bộ Tộc MixiGaming",
    group: "basics",
    meaning: "Cộng đồng fan của kênh, sinh hoạt chính ở group Facebook và Discord chính thức.",
    source: { label: "Group Facebook chính thức", href: "https://www.facebook.com/groups/mixigaming/" },
  },
  {
    term: "22:22",
    group: "basics",
    meaning: "Giờ lên sóng: 22:22–03:00, nghỉ Thứ Tư và Chủ Nhật; Thứ Bảy từ 23:00.",
    source: DESCRIPTION_SOURCE,
  },
  {
    term: "Phòng Trà An Liễng",
    group: "basics",
    meaning: "Đêm nhạc trên kênh: anh Độ hát cùng dàn khách mời, đã sang số #4. “An Liễng” là chơi chữ từ Yên Lãng — tên con phố quen thuộc trên sóng (kênh còn gọi “đại hội âm nhạc 120 An Liễng”).",
    source: { label: "Phòng Trà An Liễng #4", href: yt("m4Navy7s4l0") },
  },
  {
    term: "Ao Làng",
    group: "basics",
    meaning: "Giải đấu “cây nhà lá vườn” với anh em, gần đây là Ao Làng Delta Force (trước đó có Ao Làng PUBG).",
    source: { label: "Stream Ao Làng Delta Force", href: yt("BTMMQZNthzk") },
  },

  // ----- Đa nhân cách (the channel's own titles)
  {
    term: "Ông chủ Moi",
    group: "personas",
    meaning: "Vai trong các game giả lập kinh doanh: NeNe Shop “túi mù số 1 Yên Lãng”, tiệm Ramen hỗn loạn, gara xe cũ, tạp hóa thành phố ngầm…",
    source: { label: "Blind Box Shop Simulator #1", href: yt("27rzINSFBdk") },
  },
  {
    term: "Họa sĩ · Coder · Ông vua lý thuyết Yên Lãng",
    group: "personas",
    meaning: "Bộ danh xưng “… Yên Lãng” trong tiêu đề stream: họa sĩ (thao túng tâm lý bằng bảng vẽ), coder (đọc lệnh “ảo ma” ở Business Tour #15), ông vua lý thuyết (giáo án tân thủ Delta Force) — kèm “thầy hiệu trưởng DF”.",
    source: { label: "Stream “họa sĩ Yên Lãng”", href: yt("jQZ7x_2T2JE") },
  },
  {
    term: "Chủ tịch Phùng · Phùng đại nhân · Bố Độ",
    group: "personas",
    meaning: "Chủ tịch giả nghèo thử lòng người đời ở Scum, đại nhân kiếm hiệp ở Phantom Blade Zero, ông bố dắt “nghịch tử” đi ăn trong vlog (tên thật: Phùng Thanh Độ).",
    source: { label: "Scum 2026 #1", href: yt("JpueemXihW4") },
  },
  {
    term: "DesmouĐộ · Chim ác là Mixi · Vua trò chơi",
    group: "personas",
    meaning: "Hóa thân theo game: khiển lính cát càn quét Space City (Delta Force), chim ác là “phán đâu trúng đó” (Goose Goose Duck #86), “vua trò chơi” bị bộ đôi 97 quây kín (Machine Party #2).",
    source: { label: "Goose Goose Duck #86", href: yt("D5ye6FaNscY") },
  },
  {
    term: "Phùng Thanh Lịch · Tài tử Cao Bằng · Phùng Tham Lam",
    group: "personas",
    meaning: "Thanh Lịch: lần hiếm hoi diện gi-lê bảnh bao (chính anh Độ tự giới thiệu “phiên bản” này). Tài tử Cao Bằng: từ ảnh tóc thời trẻ giống Đan Trường. Tham Lam: làm MV “Độ Tộc 2” free nhờ mượn beat, giọng, tranh của bạn bè.",
    source: GAMEK_NICKNAMES,
  },

  // ----- Meme bất hủ
  {
    term: "Lươn Cao Bằng · “Hí anh em”",
    group: "memes",
    meaning: "“Hí anh em” mà vang lên là biết tối nay trốn stream — từ đó có “Lươn Cao Bằng”, rồi cả họ biến thể: Lươn Thanh Độ, Diễn Thanh Độ, Neymar Cao Bằng, Nhậu Thanh Độ, Dưỡng Thương Thanh Độ.",
    source: GAMEK_NICKNAMES,
  },
  {
    term: "Trốn stream",
    group: "memes",
    meaning: "Truyền thống được Bộ Tộc cụ thể hóa thành hẳn game: Mixi Stream Escape (đã tới phần 3).",
    source: { label: "Mixi Stream Escape 3", href: yt("JklCD7GmnBk") },
  },
  {
    term: "Lương 7–8 triệu",
    group: "memes",
    meaning: "Câu “khiêm tốn” bất hủ khi được hỏi thu nhập (sự kiện cuối năm 2021) — MC thốt lên “Eo ôi thương thế!” và cả cộng đồng nhại theo tới giờ.",
    source: { label: "Kenh14 (16/01/2022)", href: "https://kenh14.vn/nghe-do-mixi-tiet-lo-tien-luong-chi-7-8-trieu-mc-thanh-thanh-huyen-chi-biet-thot-len-eo-oi-thuong-the-20220116113646918.chn" },
  },
  {
    term: "Dự án ma",
    group: "memes",
    meaning: "Meme Threads (10/2026) chỉ những kèo, kế hoạch “luôn tự nhủ sẽ làm” nhưng chắc không bao giờ làm. Trên sóng là các dự định anh Độ hào hứng vạch ra lúc live — nhiều cái chỉ dừng ở ý tưởng; kênh dùng luôn trong tiêu đề (“miệt mài vẽ dự án ma”).",
    source: { label: "Kenh14: “Dự án ma” đang hot trên Threads", href: "https://kenh14.vn/du-an-ma-dang-hot-tren-threads-la-gi-215261008093910652.chn" },
  },
  {
    term: "Độ khó thiếu nhi",
    group: "memes",
    meaning: "Nhãn kênh dán cho chuỗi giải đố trong game trốn stream do fan làm — và Bộ Tộc thì biết “thiếu nhi” trên sóng chưa bao giờ dễ.",
    source: { label: "Mixi Stream Escape 3", href: yt("JklCD7GmnBk") },
  },
  {
    term: "Ra đảo · Phiên tòa Unban",
    group: "memes",
    meaning: "“Ra đảo” là bị ban khỏi group hoặc kênh chat vì lỡ hỏi câu ngớ ngẩn hay cà khịa quá đà; “Phiên tòa Unban” là dịp đọc tâm thư văn mẫu xin về đất liền.",
    source: { label: "Group Facebook chính thức", href: "https://www.facebook.com/groups/mixigaming/" },
  },

  // ----- Hội anh em (only as named in the channel's titles)
  {
    term: "Anh em Refund",
    group: "crew",
    meaning: "Hội bạn thường xuất hiện cùng anh Độ trong game và vlog (tổ đội RF).",
    source: { label: "Delta Force #6 cùng anh em Refund", href: yt("xMzsOGyWLac") },
  },
  {
    term: "Diễn viên hạng S Pewpew",
    group: "crew",
    meaning: "Bạn thân của “đạo diễn Độ Mixi” trong 1001 hoạt cảnh sáng tạo; cặp bài trùng ở Carry the Glass và các buổi tâm sự cuối tuần.",
    source: { label: "Stream 1001 hoạt cảnh", href: yt("0GNUWKSwwBE") },
  },
  {
    term: "3 nghịch tử",
    group: "crew",
    meaning: "Cách tiêu đề vlog gọi Bô, Ben, Nhism khi đi ăn nướng cùng “Bố Độ”.",
    source: { label: "Độ đi date #9", href: yt("O2XEya2TqgU") },
  },
  {
    term: "Bộ đôi 97",
    group: "crew",
    meaning: "Cái tên hay đi cùng Nhism trong tiêu đề — cùng leo đỉnh ở PEAK #5 và quây “vua trò chơi” ở Machine Party #2.",
    source: { label: "PEAK #5", href: yt("-7OxLkZSAzs") },
  },
  {
    term: "Tam tấu Mù, Mùi, Mùng",
    group: "crew",
    meaning: "Bộ ba nhân vật bày mưu làm giàu trong series GTA V 2026.",
    source: { label: "GTA V 2026", href: yt("Jp8XBWqd5R4") },
  },

  // ----- Sự vụ tháng 10–11/2026
  {
    term: "Kèn Harmonica & Phòng Giám đốc",
    group: "happenings",
    meaning: "Cơn sốt Delta Force: hạ quyết tâm nhặt bằng được kèn Harmonica và mở phòng Giám đốc kiểm chứng lời lỗ.",
    source: { label: "Stream lấy kèn Harmonica", href: yt("7PxYcD_0x4A") },
  },
  {
    term: "“Nà ná na na” & Moi Xoang",
    group: "happenings",
    meaning: "Các “siêu phẩm nà ná na na đa phong cách” trên sóng, cùng giải đấu Moi Xoang trở lại — tập luyện bằng “Goat Flappy Bird”.",
    source: { label: "Stream “siêu phẩm nà ná na na”", href: yt("UTf6x4oCBKU") },
  },
  {
    term: "Phong trào Tetris",
    group: "happenings",
    meaning: "Tetris lan khắp Discord Bộ Tộc, thành hẳn giải thi đấu giữa các thành viên.",
    source: { label: "Stream “Phong trào Tetris”", href: yt("BTMMQZNthzk") },
  },
];
