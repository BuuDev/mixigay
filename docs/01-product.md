# 01 – Sản phẩm

## Mục tiêu

Một web app nhỏ giúp fan của Độ Mixi:

1. Biết **khi nào** Độ lên sóng (lịch tuần + trạng thái live realtime + đếm ngược).
2. **Bấm một lần** để sang đúng buổi live / video trên YouTube.
3. Tìm lại video **theo game**, sắp xếp theo lượt xem; vlog là một mục riêng.
4. **Đề xuất game** cho Độ chơi, upvote, xem trạng thái đề xuất.

Trang đi theo hướng **chỉ dẫn link về kênh gốc**: lượt xem, ủng hộ, merch đều về kênh chính chủ.

## Nguyên tắc web fan (bắt buộc, không thương lượng)

- Footer mọi trang ghi rõ: **"Trang do fan làm, không liên kết chính thức với Độ Mixi / MixiGaming."**
- Không dùng logo, ảnh đại diện, font hay bộ màu nhận diện của MixiGaming (kể cả logo Refund Gaming) làm nhận diện của trang. Thumbnail video lấy từ YouTube (`i.ytimg.com`) thì được, vì nó minh họa cho chính video đó. Tranh fan anh Độ + Cú Đêm có chữ thương hiệu trên áo/cúp cũng chỉ được dùng làm minh họa nội dung ([ADR-014](08-decisions.md#adr-014)).
- Ảnh anh Độ và tranh fan vẽ được dùng làm **nội dung** (album, ảnh bìa trang chủ, màn mở đầu – [ADR-011](08-decisions.md#adr-011)), luôn có chú thích nguồn và cách xin gỡ. Không dùng làm favicon, logo header hay OG image.
- Không nhúng player làm mặc định; card video/live mở `youtube.com/watch?v=…` ở tab mới.
- Không nhận tiền dưới bất kỳ hình thức nào. Link donate/merch/ủng hộ trỏ về kênh chính chủ.
- Nội dung do fan gửi (đề xuất, quote, fan art) phải có cơ chế ẩn/xóa của admin. Fan art phải duyệt trước khi hiện.

## Người dùng

| Vai trò | Có thể làm |
|---|---|
| Khách (chưa đăng nhập) | Xem mọi trang công khai |
| Fan (đăng nhập bằng tên Bộ Tộc + mã khóa, không email) | Gửi đề xuất, upvote (1 phiếu/đề xuất), gửi quote, gửi fan art, đăng ký thông báo |
| Admin (bạn, danh sách email cố định) | Sửa lịch tuần, gán game cho video, quản lý từ khóa game, đổi trạng thái đề xuất, duyệt fan art/quote, cập nhật "Đã chơi" |

## Danh sách tính năng và mức ưu tiên

**P0 = MVP** (phải có để ra mắt), **P1** = ngay sau ra mắt, **P2** = khi có thời gian.

| # | Tính năng | Ưu tiên | Trạng thái | Ghi chú |
|---|---|---|---|---|
| F1 | Lịch stream tuần (giờ VN + giờ địa phương người xem) | P0 | UI xong (mock) | Admin nhập lịch |
| F2 | Trạng thái live / sắp live realtime + đếm ngược | P0 | UI xong (mock) | Poll YouTube + Supabase Realtime |
| F3 | Card live: tiêu đề, thumbnail, số người xem, mở YouTube | P0 | UI xong (mock) | |
| F4 | Video theo game, sắp xếp theo lượt xem / mới nhất, mục "Chưa phân loại" | P0 | UI xong (mock) | Phân loại: nhãn tay → playlist → từ khóa |
| F5 | Vlog (một "game" đặc biệt `isVlog`) | P0 | UI xong (mock) | |
| F6 | Đề xuất game: đăng nhập (tên + mã khóa), upvote, trạng thái, gợi ý trùng | P0 | UI xong (lưu tạm trình duyệt) | |
| F7 | Tự lấy thông tin game Steam từ link (ảnh, giá, thể loại) | P0 | Nhận appid xong | Steam Store API |
| F8 | "Độ đã chơi": đang chơi / phá đảo / drop, liên kết với đề xuất | P0 | UI xong (mock) | |
| F9 | Trang admin tối giản | P0 | Chưa | Không cần đẹp |
| F10 | Thông báo khi lên sóng: bot Telegram / Discord | P1 | Chưa | Tính năng fan dùng nhiều nhất |
| F11 | PWA + dark mode | P1 | Chưa | |
| F12 | Web Push | P1 | Chưa | Sau PWA |
| F13 | Thống kê stream: người xem theo giờ, giờ lên sóng TB theo thứ, chuỗi ngày stream | P1 | Chưa | Dữ liệu có sẵn từ job poll |
| F14 | Kho quote/meme theo timestamp (link `&t=…s`) | P2 | Chưa | Cần kiểm duyệt |
| F15 | Fan art gallery, duyệt trước | P2 | Chưa | Cần storage + kiểm duyệt |

## Ngoài phạm vi (không làm)

- Nhúng/phát lại video, tải video, clip lại nội dung.
- Chat, bình luận tự do giữa fan (tốn công kiểm duyệt).
- Nhận donate, bán hàng, quảng cáo.
- App mobile native (PWA là đủ).

## Chỉ số thành công (sau 1 tháng ra mắt)

- Trạng thái live trên trang lệch so với YouTube **≤ 2 phút**.
- Quota YouTube dùng **< 30%** của 10.000 đơn vị/ngày.
- ≥ 90% video mới được phân loại tự động (không rơi vào "Chưa phân loại").
- Chạy trong gói miễn phí của Vercel + Supabase.
