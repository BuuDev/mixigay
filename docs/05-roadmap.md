# 05 – Lộ trình

Mỗi giai đoạn kết thúc bằng một bản **deploy được**. Ước lượng tính cho một người làm buổi tối/cuối tuần (khoảng 10 giờ/tuần).

```
Giai đoạn 0  Prototype UI                    ✅ xong
Giai đoạn 1  Nền móng (Supabase, auth, CI)   ✅ code xong – chờ tạo project thật
Giai đoạn 2  Dữ liệu YouTube thật            ✅ code xong – chờ API key + channel ID
Giai đoạn 3  Đề xuất game thật + admin       🟡 thiếu E2E, OG image, domain → 🚀 MVP ra mắt
Giai đoạn 4  Thông báo + PWA                 ~1 tuần
Giai đoạn 5  Thống kê stream                 ~1 tuần
Giai đoạn 6  Quote & fan art                 ~2 tuần
Giai đoạn 7  Tộc Đêm v2 (docs/design)        nền xong – các khối làm dần
```

---

## Giai đoạn 0 – Prototype UI ✅

- [x] Các trang `/`, `/lich`, `/video`, `/vlog`, `/da-choi`, `/de-xuat` với dữ liệu mẫu
- [x] `src/features/*/server/queries.ts` làm lớp truy cập dữ liệu async
- [x] `classify.ts` (nhãn tay → từ khóa, vlog xét cuối), `schedule.ts` (buổi kế tiếp theo UTC+7)
- [x] Footer ghi rõ trang do fan làm

## Giai đoạn 1 – Nền móng

**Mục tiêu:** repo có test, CI, Supabase chạy local, đăng nhập Google được.

- [x] Thêm Vitest + script `test`. Viết test cho `classify.ts` và `schedule.ts`: biên qua nửa đêm, slot đúng giờ hiện tại, Chủ nhật, nhãn tay ghi đè, vlog không cướp tiêu đề game.
- [x] Thêm script `typecheck` (`tsc --noEmit`)
- [x] GitHub Actions: `lint` + `typecheck` + `test` + `build` trên mỗi PR
- [x] `supabase init`, migration đầu tiên theo [03-data-model.md](03-data-model.md), `seed.sql` từ mock-data
- [x] `src/server/supabase/{server,public,admin}.ts`, `proxy.ts` làm mới session
- [x] Đăng nhập/đăng xuất Google trong `SiteHeader`, trigger tạo `profiles`
- [x] Chuyển các getter đọc-only trong `data.ts` (games, schedule, played) sang Supabase, giữ nguyên chữ ký
- [ ] **(cần bạn)** Tạo project Vercel + Supabase production, cấu hình env (xem [06-setup.md](06-setup.md))

**Hoàn thành khi:** `npm run build` xanh trên CI. Đăng nhập Google chạy trên preview deploy. Trang `/lich` đọc từ DB.

## Giai đoạn 2 – Dữ liệu YouTube thật

**Mục tiêu:** trang hiển thị video thật, trạng thái live thật, lệch tối đa 2 phút.

- [ ] **(cần bạn)** Lấy `YOUTUBE_CHANNEL_ID` thật (xem [04-integrations.md](04-integrations.md))
- [x] `src/server/youtube/`: client `fetch` + parse duration + ghi `api_usage`
- [x] Route `/api/cron/sync-videos`: backfill lần đầu, sau đó chạy tăng dần. Phân loại `auto_game_slug` bằng `classify.ts` + `playlist_game_map`.
- [x] Route `/api/cron/poll-live`: RSS + DB → `videos.list`, cập nhật `live_status`, `live_samples`. Có logic thưa/dày theo lịch.
- [x] Bảo vệ cron bằng `CRON_SECRET`. Lên lịch `pg_cron` + `pg_net` trong Supabase (`supabase/cron.sql`, chạy tay ở production).
- [x] `LiveBanner` subscribe Realtime `live_status`
- [x] Áp dụng `"use cache"` / `cacheTag` / `revalidateTag` theo bảng trong [02-architecture.md](02-architecture.md)
- [x] `next/image` cho thumbnail `i.ytimg.com`
- [x] Test: parse duration, chuyển trạng thái live, quyết định poll dày/thưa, map dữ liệu YouTube → hàng DB
- [ ] Test tích hợp job với Supabase thật (cần `supabase start`); hiện mới kiểm chứng SQL trên PGlite và route trên stub

**Hoàn thành khi:** chạy 48 giờ trên production, `api_usage` < 3.000 đơn vị/ngày, banner tự chuyển trạng thái khi Độ lên sóng mà không cần reload.

## Giai đoạn 3 – Đề xuất game thật + Admin → 🚀 MVP

- [x] Server Actions: `createSuggestion`, `toggleVote`, `searchSimilar` (pg_trgm, gồm cả game đã chơi), rate limit 5/ngày bằng RLS
- [x] `/api/steam/[appId]` có cache. Tự điền ảnh/giá/thể loại. Chặn trùng theo `steam_app_id`.
- [x] `SuggestionBoard` bỏ localStorage, đọc/ghi Supabase. Hiển thị "đã vote" theo user.
- [x] `/admin`: sửa lịch tuần, gán game cho video "Chưa phân loại", quản lý từ khóa, đổi trạng thái đề xuất (+ liên kết `linked_game_slug`), cập nhật "Đã chơi", ẩn đề xuất spam
- [x] Trang `/da-choi` liên kết với đề xuất đã `played`
- [ ] Playwright E2E: xem lịch, lọc video theo game, đăng nhập giả lập → gửi đề xuất → vote
- [x] Trang "Giới thiệu" ghi rõ không chính thức, cách liên hệ để gỡ nội dung
- [x] `sitemap.ts`, `robots.ts`, `metadataBase`
- [ ] OG image
- [ ] **(cần bạn)** Gắn domain, bật Vercel Analytics

**Hoàn thành khi:** checklist trên xong, E2E xanh, mời 10–20 fan dùng thử và không có lỗi chặn.

## Giai đoạn 4 – Thông báo + PWA (P1)

- [x] Bot Telegram channel + Discord webhook, chống gửi trùng bằng `notifications_log`
- [ ] PWA: `app/manifest.ts`, icon riêng (không dùng logo MixiGaming), service worker
- [ ] Dark mode (Tailwind `dark:` + `prefers-color-scheme`, có nút chuyển)
- [ ] Web Push: đăng ký/hủy, gửi khi live
- [ ] `schedule_overrides` (nghỉ / đổi giờ một ngày) + UI admin
- [ ] WebSub cho phát hiện video mới nhanh hơn

## Giai đoạn 5 – Thống kê stream (P1)

- [ ] Trang `/thong-ke`: biểu đồ người xem theo thời gian của từng buổi (từ `live_samples`)
- [ ] Giờ lên sóng trung bình theo thứ, độ dài buổi trung bình, chuỗi ngày stream liên tiếp
- [ ] Top buổi đông người xem nhất
- [ ] Job dọn `live_samples`: gộp về mẫu 5 phút sau 30 ngày để giữ DB < 500 MB

## Giai đoạn 6 – Cộng đồng (P2)

- [ ] Kho quote: chọn video, nhập giây (hoặc dán link có `?t=`), duyệt trước. Link `youtube.com/watch?v=…&t=<s>s`.
- [ ] Fan art: Supabase Storage bucket `fan-art`, giới hạn 5 MB, chỉ ảnh, duyệt trước, ghi tên/credit tác giả
- [ ] Hàng đợi duyệt chung trong `/admin`
- [ ] Báo cáo nội dung (nút "báo cáo" → admin)

## Giai đoạn 7 – Tộc Đêm v2 (`docs/design/COMPONENTS.md`)

Nền đã xong: kiến trúc chia theo tính năng, token + skin, icon/logo/mascot/minh họa sinh từ brand.html, lớp motion (CSS + Motion), Embers, LiveDot; các trang hiện có đã đổi sang nhận diện mới; LiveHero có thêm trạng thái "Hôm nay Độ nghỉ".

- [x] Kiến trúc `src/features/*`, `src/shared/*`, `src/server/*` + luật ESLint phân tầng (ADR-007)
- [x] Design system Tộc Đêm, chỉ nền tối, `npm run brand` (ADR-009)
- [x] Nền animation: `@/shared/motion`, `motion.css`, skill `motion` (ADR-008)
- [x] §10 Tàn lửa nền (trang chủ, đổi đỏ khi live, tắt khi reduced-motion/pin yếu)
- [ ] **(cần designer)** Icon spec nhắc nhưng brand.html chưa có: `external`, `kindle`, `calendar-add`, `countdown`, `event`, `attend`, `tribe`, `wall`, `shop`, `bell`, `skin`, `timeline`, `expand`, `close`
- [ ] §1 Màn nhóm lửa (`features/intro`): unlit → lighting → status, 1 lần/ngày/thiết bị, nút bỏ qua
- [ ] §2 Đếm ngược vòng tròn + lịch tháng + "Thêm vào lịch" (Google Calendar link) + lịch đặc biệt do admin ghi đè (`schedule_overrides`)
- [ ] §3 Nút nổi "Đang live" (live / idle)
- [ ] §4 "Tối nay tôi có mặt" (RSVP) — bảng `attendance`, skill `fan-content`
- [ ] §5 Bức tường Bộ tộc (lưu bút ≤140 ký tự, duyệt trước, 3 tin/ngày)
- [ ] §6 Hộp ủng hộ (mở nắp → link chính chủ)
- [ ] §7 Timeline buổi stream (từ chapters trong mô tả video)
- [ ] §8 Gallery fan art + lightbox (gộp với GĐ6)
- [ ] §9 Skin theo dịp: admin bật theo khoảng ngày → `data-theme` trên `<html>`
- [ ] §11 Nút chuông thông báo (gộp với GĐ4 Web Push)
- [ ] OG image theo brand (dòng "không liên kết chính thức")

---

## Rủi ro & cách xử lý

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Hết quota YouTube | Mất trạng thái live | Bảng `api_usage` + ngưỡng 8.000. Không dùng `search.list`. Poll thưa ngoài giờ stream. |
| RSS/`videos.list` không thấy buổi live mới (live không qua lịch hẹn) | Banner chậm | WebSub (GĐ4). Nút "tìm live" thủ công trong admin (dùng `search.list` 1 lần). |
| Vercel Hobby chỉ cho cron 1 lần/ngày | Không poll được mỗi phút | Dùng `pg_cron` + `pg_net` của Supabase làm đồng hồ ([ADR-003](08-decisions.md#adr-003)) |
| Supabase free tạm dừng project sau 7 ngày không hoạt động | DB ngủ | Cron poll-live chạy liên tục nên DB luôn có hoạt động |
| Spam đề xuất | Bảng bẩn | Bắt buộc đăng nhập, rate limit, admin ẩn, chống trùng trgm + steam_app_id |
| Khiếu nại thương hiệu/bản quyền | Phải gỡ trang | Tuân thủ nguyên tắc ở [01-product.md](01-product.md), trang giới thiệu có kênh liên hệ để gỡ |
