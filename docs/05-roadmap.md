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
Giai đoạn 7  Góc Bộ Tộc v2 (docs/design)        nền xong – các khối làm dần
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
- [x] Chạy với Supabase thật: project dev trên cloud, 8 migration + seed, cài đặt Auth bằng `config push`, kiểm thử 16 bước qua giao diện (tài khoản, lời mời, bức tường, điểm danh)
- [ ] Test tích hợp các job cron (poll-live, sync-videos) với Supabase thật: cần `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID`

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
- [x] OG image
- [ ] **(cần bạn)** Gắn domain, bật Vercel Analytics

**Hoàn thành khi:** checklist trên xong, E2E xanh, mời 10–20 fan dùng thử và không có lỗi chặn.

## Giai đoạn 4 – Thông báo + PWA (P1)

- [x] Bot Telegram channel + Discord webhook, chống gửi trùng bằng `notifications_log`
- [x] PWA: `app/manifest.ts`, icon riêng 192/512/apple (lửa trại, không dùng logo MixiGaming)
- [x] PWA: service worker cho trang offline (`public/sw.js`, `/offline`)
- [ ] Web Push dùng chung service worker: **(cần bạn)** khóa VAPID
- [x] ~~Dark mode~~ — bỏ: brand chỉ có nền tối ([ADR-009](08-decisions.md#adr-009))
- [ ] Web Push: đăng ký/hủy, gửi khi live
- [x] `schedule_overrides` (nghỉ / đổi giờ một ngày) + UI admin
- [ ] WebSub cho phát hiện video mới nhanh hơn

## Giai đoạn 5 – Thống kê stream (P1) — **bỏ** (2026-11-10: chủ dự án quyết định, YouTube đã có số liệu)

- [x] ~~Trang `/thong-ke`: biểu đồ người xem theo thời gian của từng buổi (từ `live_samples`)~~ (đã gỡ)
- [x] ~~Giờ lên sóng trung bình theo thứ, độ dài buổi trung bình, chuỗi ngày stream liên tiếp (ngày tính từ 06:00 giờ VN)~~ (đã gỡ)
- [x] ~~Top buổi đông người xem nhất~~ (đã gỡ)
- [x] Job dọn `live_samples`: gộp về mẫu 5 phút sau 30 ngày để giữ DB < 500 MB (`compact_live_samples`, pg_cron hằng ngày)

## Giai đoạn 6 – Cộng đồng (P2)

- [x] Kho quote: chọn video, nhập giây (hoặc dán link có `?t=`), duyệt trước. Link `youtube.com/watch?v=…&t=<s>s` — `/kho-quote`, duyệt ở `/admin/quote`
- [x] Fan art: làm theo cách **link Google Drive của chính fan** thay cho Supabase Storage (không lưu file trên server), duyệt trước, ghi tên tác giả (`fan_art`, migration 20261110100000)
- [x] Định danh riêng tư (ADR-013): bỏ Gmail; tài khoản = tên Bộ Tộc + mã khóa cho mọi người; anh Độ / team / mod vào bằng link mời dùng 1 lần, tự đặt mã khóa; huy hiệu "✓ Chính chủ"; chặn tên giả danh (cả chữ Cyrillic, số thay chữ)
- [ ] **(cần bạn)** Đổi cài đặt Supabase Auth theo `docs/06-setup.md` (tắt đăng ký công khai, bật Email provider, tắt Confirm email / Google), tạo invite chủ trang, rồi tạo link mời cho anh Độ sau khi xác nhận qua kênh chính thức
- [ ] **(cần bạn)** Khóa Cloudflare Turnstile cho form tạo tài khoản
- [x] Hàng đợi duyệt chung trong `/admin` (đề xuất, nhạc, báo cáo; fan art do bên làm fan art nối thêm)
- [x] Báo cáo nội dung (nút "báo cáo" → admin) — bảng `reports`, hàng đợi ở `/admin`

## Giai đoạn 7 – Góc Bộ Tộc v2 (`docs/design/COMPONENTS.md`)

Nền đã xong: kiến trúc chia theo tính năng, token + skin, icon/logo/mascot/minh họa sinh từ brand.html, lớp motion (CSS + Motion), Embers, LiveDot; các trang hiện có đã đổi sang nhận diện mới; LiveHero có thêm trạng thái "Hôm nay Độ nghỉ".

- [x] Kiến trúc `src/features/*`, `src/shared/*`, `src/server/*` + luật ESLint phân tầng (ADR-007)
- [x] Design system Góc Bộ Tộc, chỉ nền tối, `npm run brand` (ADR-009)
- [x] Nền animation: `@/shared/motion`, `motion.css`, skill `motion` (ADR-008)
- [x] Trang chủ dạng thiệp cuộn: mỗi khối ≈ 1 màn hình, hiện dần khi cuộn; hero khung vòm + HUD (giờ, bộ đếm người xem, sao hype); video dạng rail vuốt ngang
- [x] §10 Tàn lửa nền (trang chủ, đổi đỏ khi live, tắt khi reduced-motion/pin yếu)
- [x] Bộ icon Phosphor duotone (ADR-010): thay 15 icon cũ, thêm `external`, `kindle`, `calendar-add`, `countdown`, `event`, `attend`, `tribe`, `wall`, `shop`, `bell`, `skin`, `timeline`, `expand`, `close`
- [x] §1 Màn nhóm lửa (`features/intro`): unlit → lighting → status, 1 lần/ngày/thiết bị, nút bỏ qua, reduced-motion nhảy thẳng
- [x] §2 Đếm ngược vòng tròn + khối ngày kiểu poster + lịch tháng (popover) + "Thêm vào lịch" (Google Calendar)
- [x] §2 Lịch đặc biệt do admin ghi đè (nối vào lịch tháng, lịch tuần, đếm ngược, màn mở đầu, nhịp poll)
- [x] §3 Nút nổi "Đang live" (live: equalizer + ping + số người xem; idle: đếm ngược rút gọn), ẩn khi có overlay
- [x] §4 "Tối nay tôi có mặt" (RSVP) — bảng `attendance`; khách chỉ lưu trên thiết bị, không tính vào tổng
- [x] §5 Bức tường Bộ tộc (lưu bút ≤140 ký tự, duyệt trước, 3 tin/ngày) — `/bo-toc`, chữ to trên `/gui-anh-do`, duyệt ở `/admin/tuong`
- [x] Nút báo cáo cho lời nhắn đã duyệt trên Bức tường (`reports.target_kind = 'wall_message'`)
- [x] Đổi tên trang thành **Góc Bộ Tộc** (ADR-011); bìa thiệp khung vòm có ảnh anh Độ, album polaroid + lightbox, ảnh hiện lên từ đống lửa ở màn mở đầu
- [ ] Ghi tên tác giả cho từng ảnh trong album khi tìm được nguồn gốc
- [x] Chuẩn UI 2026 (ADR-012): thanh tab điện thoại + menu popover, chuyển cảnh polaroid → lightbox (ViewTransition), WCAG 2.2 AA (a11y 100 trên 9 trang), sửa LCP ảnh bìa, đồng hồ theo phút
- [x] Giảm JS cho điện thoại: Supabase client (~70 KB gzip) chỉ tải khi trình duyệt rảnh, một kênh Realtime dùng chung cho cả trang
- [x] Chuyển cảnh giữa các trang (thẻ series → trang series) bằng `transitionTypes` trên `<Link>`
- [x] §6 Hộp ủng hộ (nhún, gợi ý chạm, bật nắp + confetti, sheet link chính chủ: donate ZyPage/Streamlabs, YouTube, shop, fanpage, Discord — xác minh từ kênh YouTube chính chủ 2026-11-09, có test chặn host lạ)
- [x] §7 Timeline buổi stream (chapters đọc từ mô tả video lúc sync, không tốn thêm quota) — `/video`, từng tập trong series
- [x] §8 Gallery fan art + lightbox (chuyển cảnh ViewTransition như album)
- [x] §9 Skin theo dịp: admin bật theo khoảng ngày → `data-theme` trên `<html>` (`/admin/skin`)
- [ ] §11 Nút chuông thông báo (gộp với GĐ4 Web Push)
- [x] OG image theo brand (dòng "không liên kết chính thức")

## Giai đoạn 8 – Content theo trend (khảo sát: `docs/research/2026-11-09-trends.md`)

- [x] Lịch mẫu/seed theo lịch chính chủ (22:22, nghỉ T4 & CN, T7 23:00); dữ liệu mẫu là ảnh chụp video thật của kênh
- [x] Danh mục game theo hiện tại: Delta Force, GTA V, giả lập kinh doanh, The Isle, game nhóm, game Bộ tộc làm, An Liễng, Tâm sự (59/60 video tự phân loại được)
- [x] Series tự động từ tiêu đề “(Tên #n)” — `/series`, `/series/[slug]`, rail trên trang chủ
- [x] Góc nhạc `/nhac`: Phòng Trà An Liễng + bảng nhạc nịnh fan gửi (bảng `fan_songs`, duyệt ở `/admin/nhac`), nghe trực tiếp bài SoundCloud ngay tại chỗ + trình phát nhạc nền Bộ Tộc nổi (`BgMusicPlayer`)
- [x] Bộ tộc `/bo-toc`: phong trào 30 ngày (đếm từ tiêu đề), góc tự trào “Chuyện thường ngày ở Bộ tộc” (`TribeVibe`), game Bộ tộc làm, từ điển có nguồn, link group/Discord chính chủ
- [x] ~~Đố vui Bộ Tộc tự làm câu hỏi~~ → thay bằng Quiz Bộ Tộc làm cho anh Độ (xem dưới) + Phòng tranh Fan Art qua link Google Drive cá nhân không tốn dung lượng server (`FanArtGallery`, `FanArtForm` có xem trước ảnh trực tiếp, bảng `fan_art`, duyệt ở `/admin/fan-art`)
- [x] Hồ sơ “Dự án ma” tháng 10–11 (`GhostProjectsBoard`), Máy tạo văn mẫu hối lỗi xin unban (`UnbanCourt`), Hành trình “Góp gạch xây trường” + đếm ngược 01/12 (`CharityMilestoneCard`), Radar sự kiện & Bộ thẻ Đa nhân cách (`EventRadar`, `PersonaDeck`)
- [x] P0 chống phá hoại: đề xuất duyệt trước khi hiện; giới hạn tài khoản mới, toàn site, vote; lọc chữ tiếng Việt (cờ bạc, tục tĩu, ký tự ẩn, teencode); link chỉ tới cửa hàng game/YouTube; lọc tên hiển thị; cấm và cấm ngầm trong admin
- [x] P1 chống phá hoại: nút báo cáo cho fan, giới hạn route Steam theo người (20 / 10 phút)
- [x] Cảnh báo admin khi hàng chờ tăng đột biến (`/api/cron/moderation-alert`, bảng `admin_alerts`); **(cần bạn)** điền `ADMIN_ALERT_TELEGRAM_CHAT_ID` / `ADMIN_ALERT_DISCORD_WEBHOOK_URL` và chạy lại `supabase/cron.sql`
- [ ] **(cần bạn)** Turnstile khi gửi (cần site key + secret của Cloudflare)
- [x] Vote cho nhạc nịnh (`fan_song_votes`, xếp theo lượt vote)
- [x] Giải Ao Làng / Moi Xoang / Tetris: trang giải đấu do admin nhập kết quả (`/giai-dau`, `/admin/giai-dau`; không có kết quả mẫu bịa)
- [x] Shorts: `videos.is_short` (≤ 3 phút, không phải live), rail "Shorts mới" ở trang chủ và `/video`
- [x] Từ điển Bộ tộc do fan đóng góp (duyệt trước, bắt buộc nguồn), hiện chung với danh sách có sẵn trong code
- [x] Quiz Bộ Tộc làm cho anh Độ: fan gửi link quiz đã làm trên Kahoot / Wayground / Wordwall / Quizlet / Blooket / Google Forms (bảng `quiz_links`, duyệt + đánh dấu "anh Độ đã chơi" kèm mốc giờ ở `/admin/quiz`). Không có link mẫu bịa
- [x] Ảnh nền game lấy từ thumbnail buổi stream mới nhất của game đó (`gameCovers`, không tốn quota) ở `/da-choi`, đề xuất game, `/video`
- [x] Ảnh bìa bài nhạc nịnh (`fan_songs.thumbnail_url`, lấy từ oEmbed SoundCloud/Spotify hoặc thumbnail YouTube lúc gửi)

---

## Rủi ro & cách xử lý

| Rủi ro                                                               | Ảnh hưởng                | Giảm thiểu                                                                                   |
| -------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| Hết quota YouTube                                                    | Mất trạng thái live      | Bảng `api_usage` + ngưỡng 8.000. Không dùng `search.list`. Poll thưa ngoài giờ stream.       |
| RSS/`videos.list` không thấy buổi live mới (live không qua lịch hẹn) | Banner chậm              | WebSub (GĐ4). Nút "tìm live" thủ công trong admin (dùng `search.list` 1 lần).                |
| Vercel Hobby chỉ cho cron 1 lần/ngày                                 | Không poll được mỗi phút | Dùng `pg_cron` + `pg_net` của Supabase làm đồng hồ ([ADR-003](08-decisions.md#adr-003))      |
| Supabase free tạm dừng project sau 7 ngày không hoạt động            | DB ngủ                   | Cron poll-live chạy liên tục nên DB luôn có hoạt động                                        |
| Spam đề xuất, quảng cáo cá độ, chửi bậy                              | Bảng bẩn, mất uy tín     | Duyệt trước, giới hạn theo người + tuổi tài khoản + toàn site, lọc chữ tiếng Việt, cấm/cấm ngầm (P0 trong GĐ8, [03](03-data-model.md#chống-phá-hoại-p0)) |
| Khiếu nại thương hiệu/bản quyền                                      | Phải gỡ trang            | Tuân thủ nguyên tắc ở [01-product.md](01-product.md), trang giới thiệu có kênh liên hệ để gỡ |
