# 02 – Kiến trúc

## Tổng quan

```
                       ┌──────────────────────────── Supabase ─────────────────────────────┐
                       │                                                                   │
  pg_cron (1–2 phút) ──┼──► pg_net POST ──────────────┐                                    │
                       │                              │                                    │
                       │   Postgres (bảng + RLS) ◄────┼──── ghi ─────┐                      │
                       │        │                     │              │                      │
                       │        └─► Realtime (live_status) ──► trình duyệt (LiveBanner)     │
                       │   Auth (Google OAuth)                                              │
                       └──────────────────────────────┼──────────────┼──────────────────────┘
                                                      ▼              │
  YouTube WebSub ───► /api/webhooks/youtube ──►  Next.js trên Vercel (Node.js runtime)
                                                 ├─ /api/cron/poll-live      ──► YouTube Data API
                                                 ├─ /api/cron/sync-videos    ──► YouTube Data API
                                                 ├─ /api/steam/[appId]       ──► Steam Store API
                                                 ├─ Server Actions (đề xuất, vote, admin)
                                                 └─ Trang (Server Components + "use cache")
                                                          │
                                       khi live bắt đầu ──► Telegram / Discord / Web Push
```

Một codebase TypeScript duy nhất (Next.js). Supabase dùng cho **dữ liệu, auth, realtime và đồng hồ hẹn giờ** (pg_cron). Logic job nằm trong route handler của Next.js, không viết Edge Function Deno riêng. Lý do: [ADR-003](08-decisions.md#adr-003).

## Các luồng chính

### 1. Phát hiện live (F2, F3)

Đây là luồng duy nhất cần gần như realtime. Nó phải **rẻ về quota**.

1. `pg_cron` gọi `POST /api/cron/poll-live` mỗi **1 phút** khi đang live hoặc trong khoảng ±2 giờ quanh một slot lịch, và mỗi **5 phút** vào các giờ còn lại. Route tự quyết có bỏ qua lần gọi hay không, nên cron chỉ cần một lịch `* * * * *`.
2. Route lấy danh sách **videoId ứng viên**:
   - các video có `live_state in ('live','upcoming')` trong DB,
   - 15 video mới nhất từ RSS `https://www.youtube.com/feeds/videos.xml?channel_id=…` (**0 quota**),
   - video mới mà WebSub vừa báo (xem luồng 3).
3. Gọi **một** lần `videos.list?part=snippet,liveStreamingDetails,statistics&id=<≤50 id>` (**1 đơn vị**).
4. Với mỗi video: `snippet.liveBroadcastContent` cho biết `live` / `upcoming` / `none`; `liveStreamingDetails.concurrentViewers`, `actualStartTime`, `scheduledStartTime`, `actualEndTime`.
5. Upsert vào `videos`, ghi một dòng vào `live_samples` (dùng cho thống kê F13), cập nhật dòng duy nhất trong `live_status`.
6. Nếu trạng thái chuyển `offline/upcoming → live`: gọi `revalidateTag('live', 'max')`, gửi thông báo (F10/F12), ghi `notifications_log` để không gửi trùng.

Client: `LiveBanner` render từ dữ liệu server, sau đó subscribe Supabase Realtime trên bảng `live_status` để tự đổi trạng thái mà không cần reload.

### 2. Đồng bộ video và lượt xem (F4, F5)

`POST /api/cron/sync-videos` mỗi **6 giờ**:

1. `channels.list?part=contentDetails&id=<channelId>` một lần, cache vĩnh viễn → lấy playlist uploads (`UU…`).
2. `playlistItems.list?playlistId=UU…&maxResults=50`, phân trang tới khi gặp video đã có (**1 đơn vị/trang**). Lần backfill đầu tiên đi hết danh sách.
3. `videos.list` theo lô 50 id để lấy `statistics.viewCount`, `contentDetails.duration` (**1 đơn vị/lô**).
4. Cập nhật lượt xem cho video trong 90 ngày gần nhất mỗi lần chạy; video cũ hơn cập nhật 1 lần/tuần.
5. Đồng bộ playlist chính chủ (`playlists.list` + `playlistItems.list`) để làm nhãn game (bảng `playlist_game_map`).
6. Phân loại lại các video chưa có nhãn tay, rồi `revalidateTag('videos', 'max')`.

### 3. WebSub (PubSubHubbub), tùy chọn ở P1

YouTube đẩy thông báo khi có video/stream mới tới `POST /api/webhooks/youtube` (feed Atom). Route xác minh chữ ký `X-Hub-Signature` (HMAC-SHA1 với secret lúc đăng ký), lấy videoId và thêm vào danh sách ứng viên. Nhờ đó buổi live mới được phát hiện ngay cả khi RSS chậm. Lease phải gia hạn trước khi hết hạn: cron hằng ngày gọi `/api/cron/websub-renew`.

### 4. Đề xuất game (F6, F7)

- Server Action `createSuggestion`: kiểm tra đăng nhập, rate limit (5 đề xuất/ngày/người), chuẩn hóa tên (`lower`, bỏ dấu) để chống trùng. Nếu là link Steam thì gọi `/api/steam/[appId]` (cache 7 ngày) để điền ảnh, giá, thể loại.
- Gợi ý trùng khi gõ: Server Action `searchSuggestions(q)` dùng `pg_trgm` (`similarity(name_normalized, q) > 0.3`) trên cả `suggestions` lẫn `games`, để fan thấy luôn game Độ đã chơi rồi.
- Upvote: bảng `suggestion_votes(suggestion_id, user_id)` với khóa chính kép. Trigger tăng/giảm `suggestions.upvotes`.

### 5. Admin (F9)

Trang `/admin/*`, bảo vệ 2 lớp:

1. **Mỗi page** và mỗi Server Action admin gọi `requireAdmin()` (`src/lib/auth.ts`). Ai không phải admin nhận 404. Lưu ý: layout và page render **song song**, nên check ở `admin/layout.tsx` không chặn được page stream nội dung ra. Thiếu check ở page là lỗi bảo mật (đã gặp và sửa khi smoke test).
2. RLS (`is_admin()`) chặn lại lần nữa ở DB. `src/proxy.ts` chỉ làm mới session, không quyết định quyền.

## Ngân sách quota YouTube (10.000 đơn vị/ngày)

| Việc | Tần suất | Đơn vị/lần | Đơn vị/ngày |
|---|---|---|---|
| poll-live (`videos.list`) | tối đa 1.440 lần (mỗi phút) | 1 | ≤ 1.440 |
| sync-videos: `playlistItems.list` | 4 lần × ~1 trang | 1 | ~4 |
| sync-videos: `videos.list` cập nhật lượt xem (~300 video gần đây) | 4 lần × 6 lô | 1 | ~24 |
| playlist chính chủ | 1 lần/ngày × ~10 trang | 1 | ~10 |
| Backfill toàn kênh (một lần, ~3.000 video) | 1 lần | ~120 | (một lần) |
| **Tổng thường ngày** | | | **≈ 1.500 (15%)** |

**Cấm dùng `search.list`** (100 đơn vị/lần) trong job định kỳ. Nếu cần tìm videoId của buổi live mà các nguồn trên đều bỏ sót, chỉ gọi tay từ trang admin.

Mỗi lần gọi API ghi vào bảng `api_usage(day, endpoint, units)`. Job dừng poll khi tổng trong ngày vượt 8.000 và chỉ chạy lại khi sang ngày mới (quota reset lúc 0h giờ Thái Bình Dương).

## Render và cache (Next 16, Cache Components đang bật)

`next.config.ts` đã có `cacheComponents: true`. Quy tắc:

| Dữ liệu | Cách lấy | Cache | Làm mới |
|---|---|---|---|
| Lịch tuần, danh sách game, "Đã chơi" | `"use cache"` + `cacheTag('schedule' / 'games' / 'played')` | `cacheLife('days')` | Server Action admin gọi `updateTag(...)` |
| Video theo game, vlog | `"use cache"` + `cacheTag('videos')` | `cacheLife('hours')` | sync-videos gọi `revalidateTag('videos','max')` |
| Trạng thái live | Server render ban đầu (`cacheTag('live')`, `cacheLife('minutes')`) + **Realtime ở client** | ngắn | poll-live gọi `revalidateTag('live','max')` |
| Danh sách đề xuất | Dynamic (phụ thuộc user đã vote chưa) bọc trong `<Suspense>` | không cache phần theo user | `updateTag('suggestions')` sau khi tạo/vote |
| Steam appdetails | `"use cache"` trong route `/api/steam/[appId]` | 7 ngày | – |

Trước khi viết code cache, đọc `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` và `09-revalidating.md`, vì API khác Next 14/15.

## Lớp truy cập dữ liệu

Mọi trang đọc dữ liệu qua `src/lib/data.ts` (các hàm async). Khi chuyển sang Supabase, **chỉ thay phần bên trong các hàm này**, không đổi chữ ký. Các trang và component giữ nguyên. Ghi dữ liệu đi qua Server Actions trong `src/app/**/actions.ts`.

Hai client Supabase:

- `src/lib/supabase/server.ts`: `createServerClient` từ `@supabase/ssr`, đọc cookie, dùng anon key, chịu RLS. Dùng trong Server Component và Server Action.
- `src/lib/supabase/admin.ts`: dùng service role key, **chỉ import trong `src/app/api/cron/**` và `src/app/api/webhooks/**`**. Gắn `import "server-only"` để không bị lọt vào bundle client.

## Bảo mật

- Route `/api/cron/*` yêu cầu header `Authorization: Bearer ${CRON_SECRET}`, so sánh bằng `timingSafeEqual`.
- Webhook WebSub kiểm tra HMAC. Bỏ qua body không ký.
- RLS bật trên **mọi** bảng: đọc công khai các bảng nội dung, còn ghi phải qua `auth.uid()` hoặc `is_admin()`.
- Nội dung fan gửi được render như text (React tự escape). Không dùng `dangerouslySetInnerHTML`.
- URL do fan dán: chỉ chấp nhận `http(s)`, hiển thị kèm `rel="noopener noreferrer nofollow ugc"`.
