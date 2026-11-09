// "Góp Gạch Xây Trường": the community's December charity tradition, with the
// Youth Union of the National Economics University (Đoàn trường ĐH Kinh tế Quốc dân).
// Only milestones with a public source; this site never collects money and never
// shows any bank account (docs/01-product.md).

export interface CharityMilestone {
  when: string;
  title: string;
  detail: string;
  source: { label: string; href: string };
}

const WIKI = "https://vi.wikipedia.org/wiki/%C4%90%E1%BB%99_Mixi";

export const CHARITY_MILESTONES: CharityMilestone[] = [
  {
    when: "12/2021",
    title: "Điểm trường Nậm Ban, Lai Châu",
    detail: "Tháng thiện nguyện gom gần 1,3 tỷ đồng xây trường cho trẻ em vùng cao.",
    source: { label: "Wikipedia", href: WIKI },
  },
  {
    when: "07/2022",
    title: "Chiêu Lưu, Kỳ Sơn, Nghệ An",
    detail: "Hoàn thành điểm trường mới.",
    source: { label: "Wikipedia", href: WIKI },
  },
  {
    when: "11/2022",
    title: "Tiểu học Bản Mờn, Mai Sơn, Sơn La",
    detail: "Bàn giao điểm trường.",
    source: { label: "Wikipedia", href: WIKI },
  },
  {
    when: "12/2022",
    title: "Tổng kết tháng 12 năm 2022",
    detail: "Donate cả tháng được dồn cho dự án xây trường.",
    source: { label: "Thể thao & Văn hóa", href: "https://thethaovanhoa.vn/do-mixi-tong-ket-tien-ung-ho-xay-truong-tu-donate-con-so-khung-len-den-2-ty-20230101075836137.htm" },
  },
  {
    when: "01/2025",
    title: "Phòng học & nhà công vụ ở Bắc Kạn",
    detail: "Bàn giao tại Ba Bể, Pác Nặm, Chợ Đồn.",
    source: { label: "Báo Thái Nguyên", href: "https://bbk.baothainguyen.vn/do-mixi-va-doan-truong-dh-kinh-te-quoc-dan-ve-bac-kan-lam-du-an-gop-gach-xay-truong-post68578.html" },
  },
];

export const CHARITY_DISCLAIMER =
  "Trang không nhận quyên góp và không hiển thị bất kỳ số tài khoản nào. Mọi hoạt động thiện nguyện chỉ theo dõi trực tiếp trên sóng livestream chính thức của anh Độ Mixi.";
