import type { Metadata } from "next";
import { OFFICIAL_CHANNEL_URL } from "@/lib/links";

export const metadata: Metadata = { title: "Giới thiệu – Góc Fan Độ" };

const CONTACT_URL = process.env.NEXT_PUBLIC_CONTACT_URL;

export default function AboutPage() {
  return (
    <article className="max-w-2xl space-y-4 leading-relaxed">
      <h1 className="text-2xl font-bold">Giới thiệu</h1>
      <p>
        Góc Fan Độ là trang <strong>do fan làm</strong>, <strong>không liên kết chính thức</strong> với Độ Mixi, MixiGaming hay bất kỳ
        đơn vị nào của kênh. Trang không dùng logo hay nhận diện của kênh.
      </p>
      <h2 className="text-lg font-semibold">Trang làm gì</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Tổng hợp lịch stream, trạng thái live và link video công khai trên YouTube.</li>
        <li>Mọi video mở thẳng trên YouTube. Trang không nhúng hay phát lại nội dung, nên lượt xem vẫn tính cho kênh gốc.</li>
        <li>Cho fan đề xuất game. Đề xuất được kiểm duyệt và có thể bị ẩn nếu là spam.</li>
      </ul>
      <h2 className="text-lg font-semibold">Tiền bạc</h2>
      <p>
        Trang không nhận donate, không bán hàng, không chạy quảng cáo. Muốn ủng hộ, hãy ủng hộ trực tiếp trên{" "}
        <a href={OFFICIAL_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="underline">
          kênh chính chủ
        </a>
        .
      </p>
      <h2 className="text-lg font-semibold">Dữ liệu</h2>
      <p>
        Khi đăng nhập Google, trang chỉ lưu tên hiển thị, ảnh đại diện, các đề xuất và lượt upvote của bạn. Số liệu video lấy từ YouTube Data
        API, thông tin game lấy từ Steam.
      </p>
      <h2 className="text-lg font-semibold">Liên hệ / yêu cầu gỡ nội dung</h2>
      <p>
        {CONTACT_URL ? (
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Gửi yêu cầu tại đây
          </a>
        ) : (
          "Kênh liên hệ sẽ được cập nhật."
        )}{" "}
        Nếu bạn là người của kênh và muốn trang thay đổi hoặc gỡ bất cứ nội dung gì, chúng mình sẽ làm ngay.
      </p>
    </article>
  );
}
