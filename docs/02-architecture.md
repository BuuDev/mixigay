# 02 – Kiến trúc

## Tổng quan

```
                       ┌──────────────────────────── Supabase ─────────────────────────────┐
                       │                                                                   │
  pg_cron (1–2 phút) ──┼──► pg_net POST ──────────────┐                                    │
                       │                              │                                    │
                       │   Postgres (bảng + RLS) ◄────┼──── ghi ─────┐                      │
                       │        │                     │              │                      │
                       │        └─► /api/live (CDN, theo hẹn giờ) ──► trình duyệt (LiveBanner)│
                       │   Auth (tên + mã khóa)                                              │
                       └──────────────────────────────┼──────────────┼──────────────────────┘
                                                      ▼              │
  YouTube WebSub ───► /api/webhooks/youtube ──►  Next.js trên Vercel (Node.js runtime)
                                                 ├─ /api/cron/poll-live      ──► YouTube Data API
                                                 ├─ /api/cron/sync-videos    ──► YouTube Data API
                                                 ├─ /api/steam/[appId]       ──► Steam Store API
                                                 ├─ Server Actions (đề xuất, vote, admin)
                                                 └─ Trang (Server Components + "use cache")
                                                          │
                                       khi live bắt đầu ──► Telegram / Discord
```

Một codebase TypeScript duy nhất (Next.js). Supabase dùng cho **dữ liệu, auth và đồng hồ hẹn giờ** (pg_cron); không dùng Realtime (ADR-019). Logic job nằm trong route handler của Next.js, không viết Edge Function Deno riêng. Lý do: [ADR-003](08-decisions.md#adr-003).

## Các luồng chính

### 1. Phát hiện live (F2, F3)

Đây là luồng duy nhất cần gần như realtime. Nó phải **rẻ về quota**.

1. Kiểm tra theo **hẹn giờ**, tối thiểu ([ADR-018](08-decisions.md#adr-018), [ADR-019](08-decisions.md#adr-019)). Sau mỗi lần kiểm tra, poll-live tính lần kế tiếp (`nextCheckAt` trong `src/features/live/lib/live.ts`) và lưu vào `live_poll_state.next_check_at`:
   - **đầu ca** (10 phút trước → 60 phút sau một slot, tính cả lịch đột xuất/dời/hủy): **2 phút một lần** tới khi thấy live (hẹn giờ làm tròn lên phút vì pg_cron tick theo phút, nên thực tế 2–3 phút);
   - đã có **stream hẹn giờ** (`upcoming`): ngủ tới **2 phút trước giờ hẹn**, rồi 2 phút một lần tới **1 giờ sau giờ hẹn** (bỏ stream chờ không bao giờ lên sóng). Lấy kế hoạch **sớm hơn** giữa stream hẹn giờ và khung lịch, nên một buổi đặc biệt hẹn khuya không che mất khung giờ thường;
   - **đang live**: không hỏi gì tới **4 giờ sau giờ bắt đầu** (kiểm tra kết ca); còn live thì **15 phút một lần** tới khi hết. WebSub báo video đang live có cập nhật (thường là lúc kết thúc) thì đánh thức sớm;
   - live vừa kết thúc (stream bắt đầu trong khung này), hoặc ngoài khung: ngủ tới khung kế tiếp, nhưng **không quá 6 giờ** (lưới an toàn khi WebSub sót). Ngay khi stream đã biết kết thúc, poll-live đọc RSS thêm một lần để bắt buổi phát lại trên video mới;
   - **trước mọi lần gọi ra ngoài**, poll-live đặt hẹn giờ +5 phút (`reason='retry'`): lần chạy lỗi không bị gọi lại mỗi phút, và hai tick chồng nhau không cùng kiểm tra.
   `pg_cron` vẫn chạy `* * * * *` nhưng chỉ gọi app khi `public.poll_live_due()` đúng, nên ngoài giờ live không tốn lần gọi Vercel, đơn vị YouTube hay tin Realtime nào. Admin sửa lịch → trigger đặt hẹn giờ về `now()`; WebSub thấy video `live`/`upcoming`, hoặc video đang hiện là live có cập nhật → cũng đánh thức (luồng 3). `?force=1` bỏ qua hẹn giờ.
2. Route lấy danh sách **videoId ứng viên**:
   - các video có `live_state in ('live','upcoming')` trong DB,
   - 15 video mới nhất từ RSS `https://www.youtube.com/feeds/videos.xml?channel_id=…` (**0 quota**),
   - video mới mà WebSub vừa báo (xem luồng 3).
3. Gọi **một** lần `videos.list?part=snippet,liveStreamingDetails,statistics&id=<≤50 id>` (**1 đơn vị**).
4. Với mỗi video: `snippet.liveBroadcastContent` cho biết `live` / `upcoming` / `none`; `actualStartTime`, `scheduledStartTime`, `actualEndTime`. Trang **không** hiện số người xem (ADR-019), nên không ghi `concurrent_viewers` hay `live_samples`.
5. Upsert vào `videos`, cập nhật dòng duy nhất trong `live_status` (chỉ khi có gì đổi). Sau mỗi lần kiểm tra: `revalidateTag('live-timer', { expire: 0 })` (chỉ `/api/live` mang tag này, nên tab thức dậy lấy được hẹn giờ mới); `revalidateTag('live','max')` chỉ khi thứ trang hiển thị đổi, để các lần kiểm tra đầu ca không làm mọi trang render lại.
6. Nếu trạng thái chuyển `offline/upcoming → live`: gọi `revalidateTag('live', 'max')`, gửi thông báo (F10/F12), ghi `notifications_log` để không gửi trùng.

Client (`useLiveStatus`): trang tới cùng trạng thái và `nextCheckAt`. Tab đang mở **ngủ tới ngay sau giờ server hẹn** (+90 giây, rải ngẫu nhiên trong 1 phút, `src/features/live/lib/refresh.ts`; ngủ tối đa 2 giờ; hẹn giờ đã qua mà vẫn đọc lại đúng nó thì chờ nhân đôi 2 → 4 → … → 30 phút, nên server lỗi không bị mọi tab dồn hỏi) rồi đọc `/api/live`: route tĩnh, phục vụ từ CDN, poll-live làm mới bằng tag `live`. Không có kết nối Realtime nào: hàng chục nghìn tab chỉ tốn lượt đọc CDN, và ngoài giờ live thì không tốn gì. Tab ẩn đọc một lần khi hiện lại, hoặc khi quay lại sau hơn 30 phút. Một lần đánh thức (WebSub, sửa lịch) tới trong lúc poll-live đang chạy được giữ lại, không bị kế hoạch của lần chạy đó ghi đè.

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

1. **Mỗi page** và mỗi Server Action admin gọi `requireAdmin()` (`src/features/auth/server/viewer.ts`). Ai không phải admin nhận 404. Lưu ý: layout và page render **song song**, nên check ở `admin/layout.tsx` không chặn được page stream nội dung ra. Thiếu check ở page là lỗi bảo mật (đã gặp và sửa khi smoke test).
2. RLS (`is_admin()`) chặn lại lần nữa ở DB. `src/proxy.ts` chỉ làm mới session, không quyết định quyền.

## Ngân sách quota YouTube (10.000 đơn vị/ngày)

| Việc | Tần suất | Đơn vị/lần | Đơn vị/ngày |
|---|---|---|---|
| poll-live (`videos.list`) | đầu ca 3–35 lần + kết ca 1–4 lần + lưới an toàn ~4 lần (ADR-019) | 1 | ~10–65 (tới ~65 khi có stream hẹn giờ ngoài khung mà không lên sóng) |
| sync-videos: `playlistItems.list` | 4 lần × ~1 trang | 1 | ~4 |
| sync-videos: `videos.list` cập nhật lượt xem (~300 video gần đây) | 4 lần × 6 lô | 1 | ~24 |
| WebSub ingest (`videos.list`) | mỗi thông báo video mới/cập nhật (~1–5/ngày) | 1 | ~5 |
| playlist chính chủ | 1 lần/ngày × ~10 trang | 1 | ~10 |
| Backfill toàn kênh (một lần, ~3.000 video) | 1 lần | ~120 | (một lần) |
| **Tổng thường ngày** | | | **≈ 100 (1%)** |

**Cấm dùng `search.list`** (100 đơn vị/lần) trong job định kỳ. Nếu cần tìm videoId của buổi live mà các nguồn trên đều bỏ sót, chỉ gọi tay từ trang admin.

Mỗi lần gọi API ghi vào bảng `api_usage(day, endpoint, units)`. Job dừng poll khi tổng trong ngày vượt 8.000 và chỉ chạy lại khi sang ngày mới (quota reset lúc 0h giờ Thái Bình Dương).

## Render và cache (Next 16, Cache Components đang bật)

`next.config.ts` đã có `cacheComponents: true`. Quy tắc:

| Dữ liệu | Cách lấy | Cache | Làm mới |
|---|---|---|---|
| Lịch tuần, danh sách game, "Đã chơi" | `"use cache"` + `cacheTag('schedule' / 'games' / 'played')` | `cacheLife('days')` | Server Action admin gọi `updateTag(...)` |
| Video theo game, vlog | `"use cache"` + `cacheTag('videos')`. `/video`: lọc, sắp xếp, cắt trang **trong DB** (`videos.game_slug` + index một phần, `video_game_counts()`), mỗi bộ lọc một truy vấn nhỏ | `cacheLife('hours')` | sync-videos gọi `revalidateTag('videos','max')` |
| Trạng thái live | Trang: `getLiveStatus` (`cacheTag('live')`). `/api/live` tĩnh: `getLiveFeed` (`cacheTag('live','live-timer')`); tab đọc lại đúng giờ server hẹn | `cacheLife('hours')` | poll-live: `live-timer` sau mỗi lần kiểm tra (`expire: 0`), `live` chỉ khi trạng thái đổi |
| Danh sách đề xuất | Dynamic (phụ thuộc user đã vote chưa) bọc trong `<Suspense>` | không cache phần theo user | `updateTag('suggestions')` sau khi tạo/vote |
| Steam appdetails | `"use cache"` trong route `/api/steam/[appId]` | 7 ngày | – |

Trước khi viết code cache, đọc `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` và `09-revalidating.md`, vì API khác Next 14/15.

## Lớp truy cập dữ liệu và cấu trúc mã nguồn

Mã nguồn chia theo tính năng (ADR-007, chi tiết ở `docs/07-conventions.md`). Mỗi tính năng có `server/queries.ts` (getter `"use cache"`, nhánh mock khi chưa cấu hình Supabase) và `lib/mapper.ts` (Row → kiểu domain, thuần, client dùng được). Trang trong `src/app` chỉ gọi getter rồi ghép component. Ghi dữ liệu đi qua `features/*/actions.ts` (fan) và `features/*/admin/actions.ts` (admin).

Client Supabase (`src/server/supabase/`):

- `public.ts`: anon, không cookie, dùng bên trong `"use cache"`.
- `server.ts`: `createServerClient` từ `@supabase/ssr`, đọc cookie, chịu RLS. Dùng trong Server Component dưới `<Suspense>` và trong Server Action.
- `admin.ts`: service role, chỉ dùng trong job (`src/server/jobs` + `features/*/server/*` gọi từ `src/app/api/cron/**`) và ngoại lệ đã ghi trong `docs/07-conventions.md`. Có `import "server-only"`.
- Phía trình duyệt: `src/shared/lib/supabase-browser.ts` (chưa dùng ở đâu sau ADR-019; không còn Realtime).

## Bảo mật

- Route `/api/cron/*` yêu cầu header `Authorization: Bearer ${CRON_SECRET}`, so sánh bằng `timingSafeEqual`.
- Webhook WebSub kiểm tra HMAC. Bỏ qua body không ký.
- RLS bật trên **mọi** bảng: đọc công khai các bảng nội dung, còn ghi phải qua `auth.uid()` hoặc `is_admin()`.
- Nội dung fan gửi được render như text (React tự escape). Không dùng `dangerouslySetInnerHTML`.
- URL do fan dán: chỉ chấp nhận `http(s)`, hiển thị kèm `rel="noopener noreferrer nofollow ugc"`.
