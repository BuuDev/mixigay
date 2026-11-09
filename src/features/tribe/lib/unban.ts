// "Tòa Án Bộ Tộc – Máy Tạo Văn Mẫu Hối Lỗi Xin Unban": a purely recreational meme
// generator. "Ra đảo" is common Vietnamese chat slang for being banned; the letters
// are fan jokes, not a segment of the channel. Titles used for anh Độ must come from
// the sourced glossary (lore.ts) or a real video title, e.g. "Họa sĩ Yên Lãng",
// "thầy hiệu trưởng DF" (video OGHnhs5joQY).

export interface UnbanOffense {
  id: string;
  label: string;
  badge: string;
  confession: string;
  lesson: string;
}

export interface UnbanStyle {
  id: string;
  label: string;
  badge: string;
  salutation: string;
  opening: string;
  closing: string;
  /** Base chance (0–100) that the humorous court accepts the plea. */
  baseMercy: number;
}

export const UNBAN_OFFENSES: readonly UnbanOffense[] = [
  {
    id: "ask-schedule",
    label: "Hỏi “Mấy giờ anh Độ live?” / “Thứ Tư có live không?”",
    badge: "Tội ngơ ngác",
    confession:
      "trót dại gõ câu hỏi “Hôm nay mấy giờ anh Độ lên sóng?” và “Sao Thứ Tư không thấy live?” trong khi lịch 22:22 đã ghim sáng trưng từ năm này qua tháng nọ",
    lesson: "học thuộc lòng lịch 22:22 hằng đêm (Thứ Bảy 23:00, nghỉ Thứ Tư & Chủ Nhật) trước khi chạm tay vào bàn phím",
  },
  {
    id: "harmonica-pain",
    label: "Chạm nỗi đau kèn Harmonica & Phòng Giám đốc",
    badge: "Tội cà khịa",
    confession:
      "lỡ mồm hỏi thăm chuyện lời lỗ khi quẹt thẻ phòng Giám đốc và nhắc tên chiếc kèn Harmonica đúng lúc chuỗi trận Delta Force đang căng như dây đàn",
    lesson: "chỉ cổ vũ tinh thần Thầy hiệu trưởng DF chứ không bao giờ hỏi số dư sau mỗi pha mở phòng Giám đốc nữa",
  },
  {
    id: "backseat-escape",
    label: "Chỉ đường sai trong game “độ khó thiếu nhi”",
    badge: "Tội cầm đèn chạy trước ô tô",
    confession:
      "cầm đèn chạy trước ô tô, spam chỉ đường tầm bậy trong Mixi Stream Escape 3 và xúi Ông chủ Moi nhập thêm thùng túi mù lúc NeNe Shop đang âm vốn",
    lesson: "ngồi im thưởng thức 1001 pha xử lý thần sầu thay vì làm quân sư quạt mo trên kênh chat",
  },
  {
    id: "friend-borrowed",
    label: "Cho thằng bạn cùng phòng mượn điện thoại 5 phút",
    badge: "Lý do tâm linh",
    confession:
      "vừa đi lấy cốc nước có 5 phút, để thằng bạn cùng phòng mượn máy mà lúc quay lại đã thấy tài khoản của mình đang lênh đênh giữa một hòn đảo hoang ngoài khơi",
    lesson: "khóa mật khẩu 3 lớp mỗi khi rời máy và tuyệt giao luôn với thằng bạn hay mượn điện thoại",
  },
  {
    id: "ancient-meme",
    label: "Đăng meme cổ đại / Spam “Lương 7–8 triệu”",
    badge: "Tội khảo cổ",
    confession:
      "đào lại bức ảnh chế từ thời 2019 kèm câu đùa “lương 7–8 triệu” đúng lúc các Mod đang tuần tra gắt gao nên được tặng ngay một vé đi hóng gió biển",
    lesson: "cập nhật đầy đủ trend mới từ Ao Làng, An Liễng tới NeNe Shop trước khi đăng bài",
  },
];

export const UNBAN_STYLES: readonly UnbanStyle[] = [
  {
    id: "crocodile-tears",
    label: "Hệ Nước Mắt Cá Sấu (Kể khổ bi thương)",
    badge: "Đẫm nước mắt",
    salutation: "Kính gửi Hội đồng xét xử Bộ tộc cùng các Mod giữ chìa khóa đất liền,",
    opening:
      "Từ ngày nhận án phạt ra đảo xa, đêm nào đúng 22:22 ngoài khơi gió thổi lạnh buốt em cũng ngồi bó gối nhìn về đất liền, cô đơn chẳng khác nào chú khủng long T-Rex lạc đàn trong The Isle.",
    closing: "Mong Hội đồng rủ lòng thương ném cho em một chiếc phao cứu sinh để em được về lại bờ, thoát cảnh người tối cổ chỉ biết nhìn kênh chat từ xa.",
    baseMercy: 78,
  },
  {
    id: "flattery-master",
    label: "Hệ Nịnh Thần Chưởng (Dát vàng lỗ tai)",
    badge: "Nịnh mượt",
    salutation: "Kính gửi Thầy hiệu trưởng Delta Force, Ông chủ NeNe Shop túi mù số 1 Yên Lãng, Giọng ca vàng Phòng Trà An Liễng, Họa sĩ Yên Lãng,",
    opening:
      "Trong lúc ngoài đảo chỉ có tiếng sóng vỗ, thứ duy nhất giúp em vượt qua nỗi buồn là mở đi mở lại đêm nhạc Phòng Trà An Liễng #4 dát vàng lỗ tai và chiêm ngưỡng những đường vẽ Siêu dự án ma đầy tính nghệ thuật.",
    closing: "Với tấm lòng ngưỡng mộ giọng hát Moi Xoang đỉnh cao, kính mong nhận được lệnh ân xá để em kịp về bờ vỗ tay cho Phòng Trà An Liễng số tiếp theo!",
    baseMercy: 92,
  },
  {
    id: "blame-the-cat",
    label: "Hệ Đổ Thừa Hoàn Cảnh (Tại con mèo & bàn phím)",
    badge: "Lý sự cùn",
    salutation: "Kính thưa các vị Bao Công giữ cửa group và kênh chat Bộ tộc,",
    opening:
      "Sự việc hôm ấy thực sự là một tai nạn hy hữu của vũ trụ: đúng lúc mạng nhà em bị lag thì con mèo nhảy lên bàn phím dẫm trúng phím Enter, chứ bản thân em là một tộc nhân gương mẫu suốt bao năm qua.",
    closing: "Em đã nghiêm khắc kiểm điểm con mèo và thay luôn bàn phím mới, kính mong Hội đồng xem xét giảm án cho em về đất liền làm lại từ đầu.",
    baseMercy: 45,
  },
  {
    id: "solemn-oath",
    label: "Hệ Thề Non Hẹn Biển (Quyết tâm cải tạo)",
    badge: "Nghiêm túc",
    salutation: "Kính gửi Ban Quản Trị Bộ tộc MixiGaming,",
    opening: "Sau những ngày tháng lênh đênh ngoài đảo xa tự suy ngẫm, em đã thấm thía sâu sắc nội quy sinh hoạt của Bộ tộc và nhận ra lỗi lầm của mình.",
    closing: "Em xin hứa nếu được duyệt đơn về bờ sẽ chỉ ngoan ngoãn thả tim, nghe nhạc nịnh và chấp hành nghiêm chỉnh mọi quy định của cộng đồng!",
    baseMercy: 84,
  },
];

export interface UnbanVerdict {
  approved: boolean;
  mercyScore: number;
  stampLabel: string;
  judgeNote: string;
}

export interface ComposedUnbanPlea {
  title: string;
  body: string;
  verdict: UnbanVerdict;
}

/** Deterministic hash so a given (name, offense, style, roll) produces a stable verdict. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function composeUnbanPlea(params: { applicantName?: string; offenseId: string; styleId: string; roll?: number }): ComposedUnbanPlea {
  const offense = UNBAN_OFFENSES.find((o) => o.id === params.offenseId) ?? UNBAN_OFFENSES[0];
  const style = UNBAN_STYLES.find((s) => s.id === params.styleId) ?? UNBAN_STYLES[0];
  const cleanName = (params.applicantName ?? "").trim() || "Tộc nhân đang lạnh cóng ngoài khơi";
  const roll = params.roll ?? 0;

  const h = hashSeed(`${cleanName}:${offense.id}:${style.id}:${roll}`);
  const jitter = (h % 29) - 14; // -14..+14
  const mercyScore = Math.max(12, Math.min(99, style.baseMercy + jitter));
  const approved = mercyScore >= 55;

  const body = [
    "CỘNG HÒA QUẦN ĐẢO XA BỜ – ĐƠN XIN ÂN XÁ VỀ ĐẤT LIỀN",
    "",
    style.salutation,
    "",
    `Tên tài khoản lầm lỡ: ${cleanName}`,
    `Lý do ra đảo: ${offense.label}`,
    "",
    style.opening,
    `Số là hôm đó trong một phút thiếu tỉnh táo, em đã ${offense.confession}. Nay ngồi ngoài đảo gió thổi hiu quạnh, em xin tự kiểm điểm sâu sắc và cam kết sẽ ${offense.lesson}.`,
    "",
    style.closing,
    "",
    `Ký tên từ đảo xa: ${cleanName}`,
  ].join("\n");

  const verdict: UnbanVerdict = approved
    ? {
        approved: true,
        mercyScore,
        stampLabel: "DUYỆT VỀ BỜ · NÉM PHAO CỨU SINH",
        judgeNote:
          style.id === "flattery-master"
            ? "Đoạn khen giọng ca Phòng Trà An Liễng và tranh của Họa sĩ Yên Lãng nghe rất lọt tai — duyệt cấp phao bơi về đất liền!"
            : "Thái độ biết lỗi khá thành khẩn, tạm tha cho về bờ nhưng tái phạm hỏi lịch live là ra thẳng đảo hoang nhé!",
      }
    : {
        approved: false,
        mercyScore,
        stampLabel: "BÁC ĐƠN · GIA HẠN ĐẢO 7 NGÀY",
        judgeNote:
          offense.id === "friend-borrowed" || style.id === "blame-the-cat"
            ? "Văn mẫu đổ thừa cho thằng bạn với con mèo nghe quen lắm — gia hạn visa ngoài đảo thêm 1 tuần cho mát mặt!"
            : "Văn mẫu còn hơi ngắn, chưa thấy nhắc tới siêu phẩm Phòng Trà An Liễng — ở ngoài đảo viết lại bản sâu sắc hơn nhé!",
      };

  return {
    title: `Đơn xin về bờ của ${cleanName}`,
    body,
    verdict,
  };
}
