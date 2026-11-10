# 04 – Tích hợp bên ngoài

## YouTube Data API v3

- Key: API key của Google Cloud project (không cần OAuth vì chỉ đọc dữ liệu công khai). Biến môi trường `YOUTUBE_API_KEY`, chỉ dùng ở server.
- Channel ID: lấy một lần bằng `channels.list?part=id,contentDetails&forHandle=@MixiGaming3con` (1 đơn vị), rồi lưu vào `YOUTUBE_CHANNEL_ID`. **TODO P0:** chạy lệnh này và ghi giá trị thật vào `.env.local`.
- Playlist uploads = `contentDetails.relatedPlaylists.uploads` (thường là `UU` + phần sau của channel ID).

| Endpoint | Đơn vị | Dùng cho |
|---|---|---|
| `videos.list` (≤ 50 id) | 1 | trạng thái live, người xem, lượt xem, thời lượng |
| `playlistItems.list` | 1 | liệt kê video mới / backfill |
| `playlists.list` | 1 | playlist chính chủ → nhãn game |
| `channels.list` | 1 | một lần lúc setup |
| ~~`search.list`~~ | **100** | **không dùng trong job** |

Trường cần lấy:

- `snippet.title`, `snippet.publishedAt`, `snippet.thumbnails.high.url`, `snippet.liveBroadcastContent` (`live` | `upcoming` | `none`)
- `liveStreamingDetails.scheduledStartTime`, `actualStartTime`, `actualEndTime`, `concurrentViewers` (chỉ có khi đang live)
- `statistics.viewCount`
- `contentDetails.duration` (ISO 8601, ví dụ `PT2H13M5S`)

Viết client mỏng tự làm trong `src/server/youtube/` bằng `fetch` (không cần package `googleapis`, vì nó nặng). Mỗi lần gọi phải ghi `api_usage`.

### RSS (0 quota)

`https://www.youtube.com/feeds/videos.xml?channel_id=<ID>` trả về 15 video mới nhất (Atom XML). Dùng làm nguồn videoId ứng viên cho poll-live. Parse bằng regex `<yt:videoId>` là đủ, không cần thư viện XML.

### WebSub / PubSubHubbub (P1, đã làm)

- Hub: `https://pubsubhubbub.appspot.com/subscribe`
- Topic: `https://www.youtube.com/xml/feeds/videos.xml?channel_id=<ID>`
- Đăng ký: POST form `hub.mode=subscribe`, `hub.topic`, `hub.callback=https://<domain>/api/webhooks/youtube`, `hub.secret=<WEBSUB_SECRET>`, `hub.lease_seconds=864000`, `hub.verify=async`.
- Code: logic thuần ở `src/features/videos/lib/websub.ts` (chữ ký, parse Atom, challenge; có test), phần server ở `src/features/videos/server/websub.ts`.
- `GET /api/webhooks/youtube`: trả lại `hub.challenge` (text/plain) khi `hub.mode` là subscribe/unsubscribe và `hub.topic` đúng kênh; còn lại 404.
- `POST /api/webhooks/youtube`: body tối đa 256 KB (quá thì 413). Kiểm tra `X-Hub-Signature: sha1=<hmac>` (chấp nhận cả `sha256=`) bằng `timingSafeEqual` **trước** mọi truy cập DB. Body không ký hoặc sai chữ ký: trả 202, không xử lý, ghi log. Body hợp lệ: lấy `<yt:videoId>` của đúng kênh (tối đa 50 id), gọi **một** `videos.list` (**1 đơn vị/thông báo**, qua `YouTubeClient` nên vẫn ghi `api_usage` và chịu ngưỡng 8.000) rồi upsert giống poll-live (`upsertYtVideos`: cột từ `toVideoColumns` + `auto_game_slug`), `revalidateTag('videos','max')`. Vượt ngưỡng quota: trả 202 để hub không gửi lại liên tục; sync-videos 6 giờ sẽ bù.
- `<at:deleted-entry>` (video bị xóa/ẩn): không xóa hàng (sync-videos cũng không xóa); chỉ đưa hàng đang `upcoming`/`live` về `live_state='none'` như poll-live làm với stream biến mất, và ghi log.
- Gia hạn: `POST /api/cron/websub-renew` (bảo vệ bằng `CRON_SECRET`), pg_cron gọi **hằng ngày** lúc 03:23 UTC (`supabase/cron.sql`). Lease 10 ngày nên đăng ký lại mỗi ngày là đủ, không cần lưu thời hạn lease. Không tốn quota YouTube.
- Env: `WEBSUB_SECRET`, `YOUTUBE_CHANNEL_ID`, `NEXT_PUBLIC_SITE_URL` (domain public; khi là localhost thì renew trả `{skipped:"localhost"}` vì hub không gọi tới được), cùng `YOUTUBE_API_KEY` + service role để ingest. Thiếu `WEBSUB_SECRET`/`YOUTUBE_CHANNEL_ID`: cả hai route trả 503.
- Lưu ý: WebSub báo video mới/cập nhật, **không** báo "vừa bắt đầu live". WebSub **không** ghi `live_status`: khi video được báo đang `live`/`upcoming`, nó đặt `live_poll_state.next_check_at = now()` để poll-live chạy ngay phút sau ([ADR-018](08-decisions.md#adr-018)). Đây là cách bắt các buổi live ngoài lịch mà không phải poll liên tục; lưới an toàn 2 giờ của poll-live phòng khi hub không báo.

## Steam Store API

- `GET https://store.steampowered.com/api/appdetails?appids=<id>&cc=vn&l=vietnamese` (không cần key, có giới hạn khoảng 200 request / 5 phút).
- Lấy appid từ link: regex `store\.steampowered\.com/app/(\d+)`. Hàm này đã có trong prototype (`suggestion-board.tsx`), nên tách ra `src/features/suggestions/lib/steam.ts`.
- Trường dùng: `data.name`, `data.header_image`, `data.is_free`, `data.price_overview.final_formatted`, `data.genres[].description`.
- Gọi qua route `/api/steam/[appId]` có `"use cache"` + `cacheLife('weeks')`. Client không gọi thẳng Steam (CORS + để cache chung).
- Ảnh `header_image` hiển thị bằng `next/image`, thêm `shared.akamai.steamstatic.com` / `cdn.akamai.steamstatic.com` vào `images.remotePatterns`.
- Ảnh header được tải về Supabase Storage (bucket `game-art`) một lần, sau khi fan gửi và khi admin duyệt (hoặc nút "Lưu ảnh Steam về" ở `/admin/de-xuat`), vì một số nhà mạng ở VN chặn DNS mọi host của Steam. Máy dev ở VN không tải được thì bỏ qua, production (Vercel) tải được. Xem `docs/03-data-model.md` "Ảnh game".

## Google Cloud Vision (tùy chọn)

Quét tự động thumbnail game fan tải lên (`src/features/suggestions/server/game-art.ts`, `checkImage`): `SAFE_SEARCH_DETECTION` (18+, bạo lực, khiêu gợi: LIKELY/VERY_LIKELY → chặn, POSSIBLE → admin xem kỹ) và `TEXT_DETECTION` (chữ trong ảnh chạy qua bộ lọc `screenText`, ví dụ quảng cáo cờ bạc).

- Bật **Cloud Vision API** trong cùng Google Cloud project với YouTube Data API. Project phải bật **billing** thì Vision mới chạy, dù dùng trong hạn mức miễn phí: 1.000 đơn vị/tháng đầu tiên cho mỗi tính năng (SafeSearch và Text Detection tính riêng, mỗi ảnh tốn 1 đơn vị mỗi tính năng).
- Tạo API key, giới hạn key chỉ cho Cloud Vision API, rồi đặt env `GOOGLE_VISION_API_KEY` (server-only, gửi qua header `X-Goog-Api-Key`).
- Gọi một lần mỗi ảnh tải lên, sau khi đề xuất đã qua giới hạn gửi của DB (nên spam không đốt được hạn mức), timeout 5 s, gửi ảnh WebP 640×360 đã làm sạch (không có EXIF/GPS).
- Không có key, hoặc Vision lỗi/hết hạn mức: ảnh được đánh dấu "cần xem" (không bao giờ "ổn"). Mọi đề xuất vẫn chờ admin duyệt, nên không có key thì chỉ mất lớp quét tự động.
- Ảnh Steam lưu về không qua Vision.

## Tài khoản (Supabase Auth, không OAuth)

Không dùng Google hay OAuth nào ([ADR-013](08-decisions.md#adr-013)). Tài khoản là "tên Bộ Tộc + mã khóa":
- `src/features/auth/server/accounts.ts` tạo user bằng service role (`auth.admin.createUser`) với địa chỉ ảo `u-<uuid>@id.gocbotoc.invalid`, rồi đăng nhập bằng `signInWithPassword` để có cookie phiên. `proxy.ts` làm mới phiên như trước.
- Đăng ký công khai tắt trong Supabase, nên API Auth không tạo được tài khoản nào ngoài đường này.
- Cloudflare Turnstile (tùy chọn): `NEXT_PUBLIC_TURNSTILE_SITE_KEY` hiện widget ở form tạo tài khoản, server kiểm `TURNSTILE_SECRET_KEY` qua `siteverify`.

## Thông báo khi lên sóng (P1)

Tất cả được kích hoạt từ poll-live khi phát hiện chuyển sang `live`. Mỗi kênh ghi `notifications_log(video_id, channel)` **trước khi gửi** (insert … on conflict do nothing; chỉ gửi khi insert thành công) để không gửi trùng nếu job chạy chồng nhau.

| Kênh | Cách làm | Biến môi trường |
|---|---|---|
| Telegram | Tạo bot với @BotFather, thêm bot làm admin một channel công khai, gọi `sendMessage` tới `@ten_channel` | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` |
| Discord | Webhook URL của một kênh trong server fan, POST JSON `{content, embeds}` | `DISCORD_WEBHOOK_URL` |

Nội dung mẫu: `🔴 Anh Độ đang live: <tiêu đề>` + link `youtube.com/watch?v=…`. Không gắn tag/mention anh Độ.


## Supabase Realtime (phòng "Bộ Tộc đang ở đây", bình chọn, trạng thái live)

- Phòng `tribe-room` dùng **Presence + Broadcast** trên một kênh **private** (migration `20261111090000`, policy trên `realtime.messages`): khách và fan đều nghe và được đếm (presence), **chỉ fan đã đăng nhập, không bị cấm, mới gửi được cảm xúc**, nên anon key một mình không spam được kênh. Khách bấm thì cảm xúc chỉ bay trên máy họ, kèm lời mời vào Bộ Tộc. Không có bảng nào lưu cảm xúc. Payload chỉ là `{ id }` của 4 cảm xúc cố định, kiểm tra khi nhận; mỗi tab tối đa 1 lần thả / 350 ms (5 lần liền rồi nghỉ). Số "online" là số tab đang mở (presence anon vẫn có thể bị thổi phồng bằng nhiều kết nối, nên coi là con số ước lượng).
- Bình chọn nghe `postgres_changes` trên `poll_options`; trạng thái live nghe `live_status`. Cả ba dùng chung một kết nối WebSocket mỗi tab.
- Phòng chỉ kết nối khi khối "Góc tương tác" cuộn tới gần màn hình (`MountWhenVisible`), để khách không cuộn tới thì không chiếm kết nối.
- **Hạn mức cần để ý khi anh Độ live:** gói Free khoảng 200 kết nối đồng thời và ~100 message/giây cho cả project (Pro: 500 kết nối). Vượt hạn mức thì Realtime bỏ bớt message: trang không lỗi nhưng số online / cảm xúc / cập nhật live không còn tức thời. Khi lượng fan lớn, nâng gói hoặc chỉnh quota trong Realtime Settings.
- Realtime Settings: kênh `tribe-room` là private, nên **không** cần bật quyền truy cập public; các kênh `postgres_changes` (bình chọn, live) vẫn theo RLS của bảng.
