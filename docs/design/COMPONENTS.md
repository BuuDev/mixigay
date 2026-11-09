# Góc Bộ Tộc — Đặc tả component & tính năng (v2)

Tài liệu này mô tả *cái gì* và *trông thế nào*; bạn tự chọn cách code. Mỗi mục ghi: mục đích · trạng thái · dữ liệu · asset dùng · quy tắc chuyển động. Token màu theo `tokens/tokens.css`; icon theo `icons/`; minh họa theo `illustrations/` và `mascot/`.

Nguyên tắc chung
- Mobile-first, một cột dọc; mỗi khối chiếm gần một màn hình điện thoại, chữ to, ít text (học từ thiệp điện tử).
- Chỉ **một** khoảnh khắc có hiệu ứng lớn: màn nhóm lửa. Phần còn lại tĩnh, chuyển động chỉ để trả lời thao tác (mở, đóng, xác nhận).
- Mọi link ra ngoài trỏ về kênh/shop/fanpage chính chủ; dùng icon `external`. Không bao giờ nhận tiền trên trang.
- Tôn trọng `prefers-reduced-motion`: tắt tàn lửa, tắt pulse, màn nhóm lửa nhảy thẳng sang trạng thái cuối.

---

## 1. Màn nhóm lửa (intro ritual)
**Mục đích** Thay màn "Mở thiệp": tạo nghi thức vào trang và báo ngay trạng thái hôm nay.
**Trạng thái**
1. `unlit` — nền `night`, `illustrations/intro-unlit.svg`, nút chính "Nhóm lửa" (icon `kindle`), link phụ "Vào thẳng".
2. `lighting` — 600–900 ms: than sáng dần → lửa bùng lên (đổi sang `intro-lit.svg` với scale từ 0.6→1), tàn lửa bắt đầu bay.
3. `status` — ngay sau khi lửa cháy, hiện một dòng duy nhất theo dữ liệu:
   - Đang live: badge `live` + số người xem + nút "Xem trên YouTube" (`external`). Mascot `cu-toc-live`.
   - Sắp live: "Còn 02:14:09 nữa" (đếm chạy) + "Thêm vào lịch" (`calendar-add`). Mascot `cu-toc-wait`.
   - Ngày nghỉ (T4, CN): "Hôm nay Độ nghỉ. Hẹn 22:22 thứ Năm." Mascot `cu-toc-sleep`.
4. Hiện 1 lần/ngày/thiết bị (`localStorage: td.intro.<yyyy-mm-dd>`). Luôn có nút bỏ qua.
**Dữ liệu** trạng thái live (poll 60–120 s), lịch thường lệ, lịch đặc biệt do admin nhập.

## 2. Đếm ngược + lịch tháng + Thêm vào lịch
**Mục đích** Khối lõi của trang chủ.
**Hiển thị** vòng tròn tiến trình (`illustrations/countdown-hero.svg` làm mẫu bố cục): số giờ:phút:giây to, bên dưới "22:22 · Thứ Năm 12/11". Dưới nữa là lịch tháng 7 cột T2→CN:
- ngày có stream: chấm `ember`; ngày nghỉ: chấm `muted` kèm icon `offday` khi chạm; sự kiện đặc biệt: icon `event` màu `ember-glow`; hôm nay: viền `cream`.
- chạm một ngày: mở popover giờ lên sóng + nút "Thêm vào lịch".
**Logic** `components/calendarLink.ts` có `nextStream()` (lịch thường lệ) và `googleCalendarLink()`. Lịch đặc biệt do admin ghi đè theo ngày.
**Icon** `countdown`, `calendar-add`, `schedule`, `event`, `offday`.

## 3. Nút nổi "Đang live"
Góc dưới-phải, luôn hiện khi cuộn. Hai dạng: `live` (nền `live`, chấm pulse `.td-live-dot`, số người xem, chạm → YouTube) và `idle` (nền `panel`, đếm ngược rút gọn "02:14", chạm → cuộn tới khối đếm ngược). Không hiện khi màn nhóm lửa đang mở.

## 4. "Tối nay tôi có mặt" (RSVP)
**Mục đích** Đếm số fan hẹn xem; tạo cảm giác cộng đồng.
**Hiển thị** nút lớn icon `attend`; sau khi bấm đổi thành "Đã hẹn ✓" và dòng "1.240 người Bộ tộc đã hẹn 22:22" với icon `tribe`; minh họa `attend-crowd.svg`.
**Dữ liệu** bảng `attendance(date, user_id)`; khách chưa đăng nhập được bấm 1 lần/thiết bị (localStorage), đăng nhập thì ghi DB. Reset theo ngày.

## 5. Bức tường Bộ tộc (lưu bút)
**Hiển thị** danh sách lời nhắn ngắn ≤140 ký tự, tên hiển thị, thời gian tương đối; mới nhất trên cùng; nền card `panel`, viền `line`. Trống: `wall-empty.svg` + "Là người đầu tiên viết lên tường".
**Quy tắc** duyệt trước khi hiện; chống spam bằng đăng nhập Google + giới hạn 3 tin/ngày; lọc từ cấm. Đổi tiêu đề theo dịp (xem mục 9).
**Icon** `wall`, `quote`.

## 6. Hộp ủng hộ (mở hộp → link chính chủ)
**Hiển thị** `giftbox-closed.svg`, chữ "Chạm để mở"; chạm → nắp bật (`giftbox-open.svg`), hiện 4–6 nút: Kênh YouTube, Fanpage, Shop chính chủ (`shop`), Donate chính thức, Discord/nhóm. Mỗi nút icon `external`.
**Quy tắc** chỉ link ra ngoài; ghi rõ "Trang không nhận tiền. Mọi ủng hộ đi thẳng tới Độ."

## 7. Timeline buổi stream
Danh sách dọc có trục (`timeline`): giờ · tên đoạn · game/tag. Sau stream, tự sinh từ chương (chapters) trong mô tả video nếu có; admin có thể sửa. Trạng thái "đang diễn ra" tô `ember`.

## 8. Gallery (fan art + thumbnail)
Lưới 2 cột mobile / 4 cột desktop; chạm → lightbox (`expand`, `close`) có nút "Xem video gốc" (`external`). Fan art có tên tác giả và trạng thái duyệt. Thumbnail lấy từ YouTube API, không tải về lưu lại.

## 9. Skin theo dịp
`themes/*.css`: `default`, `mixi-cup`, `tet`, `birthday`. Chỉ đổi biến màu bằng `data-theme` trên `<html>`; logo, icon, layout giữ nguyên (logo dùng `currentColor`/`var(--td-ember)` nên tự đổi). Admin bật skin theo khoảng ngày. Icon `skin`.

## 10. Tàn lửa nền
`components/Embers.tsx` + `embers.css`. 12–18 hạt, chỉ ở trang chủ, `live=true` đổi sang đỏ. Ẩn hoàn toàn khi reduced-motion hoặc khi pin yếu (`navigator.getBattery` nếu có).

## 11. Thông báo lên sóng
Nút `bell`: web push (VAPID) hoặc link bot Telegram/Discord. Chỉ hỏi quyền sau khi người dùng chạm, không hỏi lúc tải trang.

## 12. Mascot Cú Tộc — khi nào dùng pose nào
| Pose | Dùng ở |
|---|---|
| `hello` | trang chủ lần đầu, trang giới thiệu, footer |
| `live` | màn nhóm lửa khi đang live, badge góc |
| `wait` | đếm ngược, empty state "chưa có video hôm nay" |
| `sleep` | ngày nghỉ, 404 lúc khuya |
| `sad` | lỗi tải, offline |
| `win` | sau khi vote thành công, game được đánh dấu phá đảo, xác nhận có mặt |
Mascot là nhân vật gốc của trang, không phải hình ảnh Độ. Có thể đặt lời thoại ngắn kiểu Bộ tộc nhưng không gán câu nói thật của Độ cho mascot.
