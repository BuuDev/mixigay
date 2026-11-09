# 05 – Lộ trình

Mỗi giai đoạn kết thúc bằng một bản **deploy được**. Ước lượng tính cho một người làm buổi tối/cuối tuần (khoảng 10 giờ/tuần).

```
Giai đoạn 0  Prototype UI                    ✅ xong
Giai đoạn 1  Nền móng (Supabase, auth, CI)   ~1 tuần
Giai đoạn 2  Dữ liệu YouTube thật            ~1–2 tuần
Giai đoạn 3  Đề xuất game thật + admin       ~1–2 tuần   → 🚀 MVP ra mắt
Giai đoạn 4  Thông báo + PWA                 ~1 tuần
Giai đoạn 5  Thống kê stream                 ~1 tuần
Giai đoạn 6  Quote & fan art                 ~2 tuần
```

---

## Giai đoạn 0 – Prototype UI ✅

- [x] Các trang `/`, `/lich`, `/video`, `/vlog`, `/da-choi`, `/de-xuat` với dữ liệu mẫu
- [x] `src/lib/data.ts` làm lớp truy cập dữ liệu async
- [x] `classify.ts` (nhãn tay → từ khóa, vlog xét cuối), `schedule.ts` (buổi kế tiếp theo UTC+7)
- [x] Footer ghi rõ trang do fan làm

## Giai đoạn 1 – Nền móng

**Mục tiêu:** repo có test, CI, Supabase chạy local, đăng nhập Google được.

- [ ] Thêm Vitest + script `test`. Viết test cho `classify.ts` và `schedule.ts`: biên qua nửa đêm, slot đúng giờ hiện tại, Chủ nhật, nhãn tay ghi đè, vlog không cướp tiêu đề game.
- [ ] Thêm script `typecheck` (`tsc --noEmit`)
- [ ] GitHub Actions: `lint` + `typecheck` + `test` + `build` trên mỗi PR
- [ ] `supabase init`, migration đầu tiên theo [03-data-model.md](03-data-model.md), `seed.sql` từ mock-data
- [ ] `src/lib/supabase/{server,client,admin}.ts`, `proxy.ts` làm mới session
- [ ] Đăng nhập/đăng xuất Google trong `SiteHeader`, trigger tạo `profiles`
- [ ] Chuyển các getter đọc-only trong `data.ts` (games, schedule, played) sang Supabase, giữ nguyên chữ ký
- [ ] Tạo project Vercel + Supabase production, cấu hình env (xem [06-setup.md](06-setup.md))

**Hoàn thành khi:** `npm run build` xanh trên CI. Đăng nhập Google chạy trên preview deploy. Trang `/lich` đọc từ DB.

## Giai đoạn 2 – Dữ liệu YouTube thật

**Mục tiêu:** trang hiển thị video thật, trạng thái live thật, lệch tối đa 2 phút.

- [ ] Lấy `YOUTUBE_CHANNEL_ID` thật (xem [04-integrations.md](04-integrations.md))
- [ ] `src/lib/youtube/`: client `fetch` + parse duration + ghi `api_usage`
- [ ] Route `/api/cron/sync-videos`: backfill lần đầu, sau đó chạy tăng dần. Phân loại `auto_game_slug` bằng `classify.ts` + `playlist_game_map`.
- [ ] Route `/api/cron/poll-live`: RSS + DB → `videos.list`, cập nhật `live_status`, `live_samples`. Có logic thưa/dày theo lịch.
- [ ] Bảo vệ cron bằng `CRON_SECRET`. Lên lịch `pg_cron` + `pg_net` trong Supabase (SQL trong `supabase/migrations/`).
- [ ] `LiveBanner` subscribe Realtime `live_status`
- [ ] Áp dụng `"use cache"` / `cacheTag` / `revalidateTag` theo bảng trong [02-architecture.md](02-architecture.md)
- [ ] `next/image` cho thumbnail `i.ytimg.com`
- [ ] Test: parse duration, chuyển trạng thái live (offline → upcoming → live → offline), chặn quota khi vượt 8.000

**Hoàn thành khi:** chạy 48 giờ trên production, `api_usage` < 3.000 đơn vị/ngày, banner tự chuyển trạng thái khi Độ lên sóng mà không cần reload.

## Giai đoạn 3 – Đề xuất game thật + Admin → 🚀 MVP

- [ ] Server Actions: `createSuggestion`, `toggleVote`, `searchSuggestions` (pg_trgm), rate limit
- [ ] `/api/steam/[appId]` có cache. Tự điền ảnh/giá/thể loại. Chặn trùng theo `steam_app_id`.
- [ ] `SuggestionBoard` bỏ localStorage, đọc/ghi Supabase. Hiển thị "đã vote" theo user.
- [ ] `/admin`: sửa lịch tuần, gán game cho video "Chưa phân loại", quản lý từ khóa, đổi trạng thái đề xuất (+ liên kết `linked_game_slug`), cập nhật "Đã chơi", ẩn đề xuất spam
- [ ] Trang `/da-choi` liên kết với đề xuất đã `played`
- [ ] Playwright E2E: xem lịch, lọc video theo game, đăng nhập giả lập → gửi đề xuất → vote
- [ ] Trang "Giới thiệu" ghi rõ không chính thức, cách liên hệ để gỡ nội dung
- [ ] Metadata/OG image, `sitemap.ts`, `robots.ts`
- [ ] Gắn domain, bật Vercel Analytics

**Hoàn thành khi:** checklist trên xong, E2E xanh, mời 10–20 fan dùng thử và không có lỗi chặn.

## Giai đoạn 4 – Thông báo + PWA (P1)

- [ ] Bot Telegram channel + Discord webhook, chống gửi trùng bằng `notifications_log`
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
