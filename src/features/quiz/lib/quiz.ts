import type { QuizQuestion, QuizRank } from "../types";

export const STARTER_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-2222",
    question: "Khung giờ lên sóng quen thuộc các tối trong tuần của anh Độ Mixi là mấy giờ?",
    options: ["20:00 tròn trịa", "22:22 huyền thoại", "23:59 nửa đêm", "19:30 giờ vàng"],
    correctIndex: 1,
    explanation: "22:22 là con số tâm linh quen thuộc mà anh em Bộ Tộc ngồi canh ở phòng chờ mỗi tối.",
    authorName: "Bộ Tộc",
  },
  {
    id: "q-que-quan",
    question: "Quê hương của anh Độ Mixi ở tỉnh nào — nơi gắn liền với biệt danh “Lươn …”?",
    options: ["Cao Bằng", "Lạng Sơn", "Thái Nguyên", "Bắc Kạn"],
    correctIndex: 0,
    explanation: "“Lươn Cao Bằng” là thương hiệu bất hủ mỗi khi Tộc Trưởng hứa hẹn hoặc vẽ dự án trên sóng.",
    authorName: "Bộ Tộc",
  },
  {
    id: "q-harmonica",
    question: "Trong tựa game Garena Delta Force tháng 10/2026, vật phẩm nào khiến anh Độ quyết tâm cày nhiệm vụ bằng được?",
    options: ["Chảo vàng cấp 3", "Kèn Harmonica", "Cúp Vua Trò Chơi", "Thẻ phòng giám đốc"],
    correctIndex: 1,
    explanation: "Chuỗi stream “Hạ quyết tâm đi lấy kèn Harmonica” (7PxYcD_0x4A & IquVH9BaANU) là điểm nhấn lớn của series Delta Force.",
    authorName: "Bộ Tộc",
  },
  {
    id: "q-nene-shop",
    question: "Khi chơi Blind Box Shop Simulator, anh Độ đặt tên tiệm túi mù số 1 Yên Lãng của mình là gì?",
    options: ["Moi Xoang Store", "NeNe Shop", "Refund Mart", "Tiệm Tạp Hóa Phùng"],
    correctIndex: 1,
    explanation: "NeNe Shop — tiệm túi mù lè khe đạt đỉnh doanh thu trong chuỗi video Blind Box Shop Simulator.",
    authorName: "Bộ Tộc",
  },
  {
    id: "q-an-lieng",
    question: "Chương trình âm nhạc “dát vàng lỗ tai” trên kênh của anh Độ có tên gọi chính thức là gì?",
    options: ["Phòng Trà An Liễng", "Giọng Ca Vàng Yên Lãng", "Đêm Nhạc Moi Xoang", "Idol Cao Bằng"],
    correctIndex: 0,
    explanation: "Phòng Trà An Liễng (đã tới số #4 với hơn 2,8 triệu lượt xem) quy tụ dàn khách mời anh tài.",
    authorName: "Bộ Tộc",
  },
  {
    id: "q-stream-escape",
    question: "Tựa game do thành viên Bộ Tộc tự thiết kế giúp anh Độ “tìm đường trốn stream” đầu tháng 11/2026 có tên là gì?",
    options: ["Mixi Stream Escape 3", "Yên Lãng Simulator", "Trốn Vợ Đi Nhậu", "Giải Cứu Tộc Trưởng"],
    correctIndex: 0,
    explanation: "Mixi Stream Escape 3 (JklCD7GmnBk) là phần 3 của series game giải đố do fan làm tặng anh Độ.",
    authorName: "Bộ Tộc",
  },
];

/** Evaluates a player's quiz score and returns a humorous Bộ Tộc rank. */
export function evaluateQuizRank(correct: number, total: number): QuizRank {
  if (total <= 0) {
    return {
      title: "Khách qua đường",
      badge: "Tân binh",
      summary: "Chưa làm câu nào hết, bấm chọn đáp án để thử sức nhé!",
    };
  }
  const ratio = correct / total;
  if (ratio >= 0.85) {
    return {
      title: "Trưởng lão Yên Lãng · Fan cứng lâu năm",
      badge: "Hạng S+",
      summary: "Thuộc làu từng buổi stream, từng câu nói cửa miệng của anh Độ. Xứng đáng ngồi hàng ghế đầu phòng chờ 22:22!",
    };
  }
  if (ratio >= 0.5) {
    return {
      title: "Thành viên Bộ Tộc chăm chỉ",
      badge: "Hạng A",
      summary: "Nắm bắt khá chắc các sự kiện nóng trong Bộ Tộc, chỉ thiếu vài chi tiết nhỏ lúc nửa đêm thôi.",
    };
  }
  return {
    title: "Tân binh mới nhập tịch Bộ Tộc",
    badge: "Mầm non",
    summary: "Chắc mới chỉ xem highlight TikTok đúng không? Tối nay 22:22 nhớ canh lên sóng cùng anh Độ nhé!",
  };
}

