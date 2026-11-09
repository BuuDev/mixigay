# 08 – Nhật ký quyết định (ADR)

Mỗi quyết định ghi lại bối cảnh, lựa chọn và hệ quả. Không xóa ADR cũ; nếu thay đổi quyết định, thêm ADR mới ghi "thay thế ADR-xxx".

## ADR-001 – Next.js (TS) + Supabase + Vercel {#adr-001}

**Trạng thái:** Chấp nhận, 2026-11

**Bối cảnh:** Web chủ yếu đọc nội dung, có một phần cần realtime (live) và một phần cần đăng nhập (đề xuất). Một người làm, muốn chạy trong gói miễn phí.

**Quyết định:** Next.js 16 App Router (TypeScript), Supabase (Postgres, Auth Google, Realtime, pg_cron), deploy trên Vercel.

**Phương án đã cân nhắc:** Astro + Supabase nhẹ hơn cho trang tĩnh, nhưng phần đề xuất/admin tương tác nhiều và prototype đã viết bằng Next. Firebase thì không có SQL, nên khó làm truy vấn trgm, thống kê và RLS rõ ràng.

**Hệ quả:** Phụ thuộc giới hạn free tier của Supabase (500 MB DB, project bị tạm dừng nếu 7 ngày không hoạt động) và Vercel Hobby.

## ADR-002 – Chỉ link, không nhúng player {#adr-002}

**Trạng thái:** Chấp nhận

**Quyết định:** Card video/live mở `youtube.com/watch?v=` ở tab mới. Không nhúng iframe làm mặc định.

**Lý do:** Lượt xem, chat và ủng hộ về kênh gốc; tránh bị xem là trang phát lại nội dung; trang nhẹ hơn.

## ADR-003 – Đồng hồ cron là Supabase pg_cron, logic nằm ở Next route handler {#adr-003}

**Trạng thái:** Chấp nhận

**Bối cảnh:** Cần poll mỗi 1 phút. Vercel Cron trên gói Hobby chỉ chạy tối đa 1 lần/ngày. GitHub Actions schedule tối thiểu 5 phút và hay trễ.

**Quyết định:** `pg_cron` + `pg_net` trong Supabase gọi `POST /api/cron/*` trên Vercel, xác thực bằng `CRON_SECRET` lưu trong Supabase Vault. Logic viết bằng TS trong repo Next, không dùng Supabase Edge Functions (Deno).

**Hệ quả:** Một codebase, test bằng cùng công cụ. Đổi lại, mỗi phút tốn một lần gọi function Vercel (~43k lần/tháng, trong hạn mức Hobby). Nếu sau này nâng Vercel Pro thì có thể chuyển sang Vercel Cron mà không phải sửa route.

## ADR-004 – Phát hiện live bằng RSS + `videos.list`, không dùng `search.list` {#adr-004}

**Trạng thái:** Chấp nhận

**Quyết định:** Lấy ứng viên từ RSS (0 quota) + DB + WebSub, rồi `videos.list` (1 đơn vị) để lấy trạng thái. `search.list` (100 đơn vị) chỉ được gọi tay từ admin.

**Hệ quả:** Khoảng 1.500 đơn vị/ngày thay vì vượt quota. Có khả năng bỏ sót buổi live không xuất hiện trong RSS; WebSub và nút admin là phương án dự phòng.

## ADR-005 – Phân loại game: nhãn tay → playlist chính chủ → từ khóa {#adr-005}

**Trạng thái:** Chấp nhận (đã cài một phần trong `src/lib/classify.ts`)

**Quyết định:** Thứ tự ưu tiên là `manual_game_slug` > playlist map > từ khóa tiêu đề (game thường trước, vlog sau) > "Chưa phân loại". Vlog là một game có `is_vlog = true`, không phải module riêng.

**Hệ quả:** Admin cần gán tay video chưa nhận diện. Từ khóa nằm trong DB nên sửa không cần deploy lại. Lưu từ khóa/playlist trong admin sẽ phân loại lại toàn bộ (`reclassifyAll`).

## ADR-006 – Chạy được không cần backend (chế độ mock) {#adr-006}

**Trạng thái:** Chấp nhận

**Quyết định:** Khi thiếu `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, `src/lib/data.ts` trả dữ liệu mẫu, `SuggestionBoard` chạy chế độ demo, auth và admin tắt.

**Lý do:** CI build không cần secret; người mới clone về là chạy được ngay; làm UI không phụ thuộc DB.

**Hệ quả:** Mỗi getter phải giữ cả hai nhánh. Không được import `mock-data.ts` ở chỗ nào khác ngoài `data.ts`.
