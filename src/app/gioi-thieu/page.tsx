import type { Metadata } from "next";
import { OFFICIAL_CHANNEL_URL } from "@/shared/lib/links";

export const metadata: Metadata = { title: "Giới thiệu – Góc Bộ Tộc" };

const CONTACT_URL = process.env.NEXT_PUBLIC_CONTACT_URL;

export default function AboutPage() {
  return (
    <article className="max-w-2xl space-y-4 leading-relaxed">
      <h1 className="text-2xl font-bold">Giới thiệu</h1>
      <p>
        Góc Bộ Tộc là trang <strong>do fan làm</strong>, <strong>không liên kết chính thức</strong> với anh Độ Mixi, Kênh MixiGaming hay bất kỳ đơn vị nào của
        kênh. Trang không dùng logo hay nhận diện của kênh.
      </p>
      <h2 className="text-lg font-semibold">Trang làm gì</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Tổng hợp lịch stream, trạng thái live và link video công khai trên YouTube.</li>
        <li>Mọi video mở thẳng trên YouTube. Trang không nhúng hay phát lại nội dung, nên lượt xem vẫn tính cho kênh gốc.</li>
        <li>Cho fan đề xuất game. Đề xuất được kiểm duyệt và có thể bị ẩn nếu là spam.</li>
        <li>
          Album anh Độ: ảnh sưu tầm từ cộng đồng Bộ Tộc, phần lớn chưa rõ tác giả (ghi dưới mỗi ảnh). Tác giả muốn được ghi tên hoặc gỡ ảnh, xem mục Liên hệ bên
          dưới.
        </li>
        <li>
          Cho fan gửi link bài “nhạc nịnh” tự làm. Bài chỉ hiện sau khi được duyệt và luôn mở ở nền tảng gốc (YouTube, SoundCloud…); trang không lưu hay phát
          nhạc.
        </li>
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
        Tài khoản ở Góc Bộ Tộc chỉ gồm <strong>tên Bộ Tộc và mã khóa</strong>: trang không hỏi email, số điện thoại hay tài khoản Google/Facebook của bất kỳ ai,
        kể cả anh Độ. Trang chỉ lưu tên đăng nhập, tên hiển thị, các đề xuất, lượt upvote, báo cáo, lời nhắn trên Bức tường, lượt “Tối nay tôi có mặt” (chỉ công
        khai tổng số) và những gì bạn tự gửi (bài nhạc, tranh, câu đố). Mã khóa được lưu dạng băm, không ai xem được; mất mã khóa thì không khôi phục được tài
        khoản. Để chống spam, trang lưu tạm mã mạng đã băm (không lưu địa chỉ IP) và có thể dùng bước xác minh Cloudflare Turnstile khi tạo tài khoản. Khách
        chưa đăng nhập bấm “có mặt” thì chỉ lưu trên máy của bạn. Số liệu video lấy từ YouTube Data API, thông tin game lấy từ Steam.
      </p>
      <h2 id="lien-he" className="scroll-mt-20 text-lg font-semibold">
        Liên hệ / yêu cầu gỡ nội dung
      </h2>
      <p>
        {CONTACT_URL ? (
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Gửi yêu cầu tại đây
          </a>
        ) : (
          "Kênh liên hệ sẽ được cập nhật."
        )}{" "}
        Nếu bạn là người của kênh hoặc tác giả một ảnh trong album và muốn trang thay đổi hoặc gỡ bất cứ nội dung gì, chúng mình sẽ làm ngay.
      </p>
    </article>
  );
}
