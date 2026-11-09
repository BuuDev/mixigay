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

### WebSub / PubSubHubbub (P1)

- Hub: `https://pubsubhubbub.appspot.com/subscribe`
- Topic: `https://www.youtube.com/xml/feeds/videos.xml?channel_id=<ID>`
- Đăng ký: POST form `hub.mode=subscribe`, `hub.topic`, `hub.callback=https://<domain>/api/webhooks/youtube`, `hub.secret=<WEBSUB_SECRET>`, `hub.lease_seconds=864000`.
- Route `GET` trả lại `hub.challenge` để xác minh. Route `POST` kiểm tra `X-Hub-Signature: sha1=<hmac>` rồi lấy videoId.
- Gia hạn: cron hằng ngày, đăng ký lại khi lease còn dưới 2 ngày.
- Lưu ý: WebSub báo video mới/cập nhật, **không** báo "vừa bắt đầu live". Vì vậy vẫn cần poll-live để biết trạng thái.

## Steam Store API

- `GET https://store.steampowered.com/api/appdetails?appids=<id>&cc=vn&l=vietnamese` (không cần key, có giới hạn khoảng 200 request / 5 phút).
- Lấy appid từ link: regex `store\.steampowered\.com/app/(\d+)`. Hàm này đã có trong prototype (`suggestion-board.tsx`), nên tách ra `src/features/suggestions/lib/steam.ts`.
- Trường dùng: `data.name`, `data.header_image`, `data.is_free`, `data.price_overview.final_formatted`, `data.genres[].description`.
- Gọi qua route `/api/steam/[appId]` có `"use cache"` + `cacheLife('weeks')`. Client không gọi thẳng Steam (CORS + để cache chung).
- Ảnh `header_image` hiển thị bằng `next/image`, thêm `shared.akamai.steamstatic.com` / `cdn.akamai.steamstatic.com` vào `images.remotePatterns`.

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
| Web Push | Thư viện `web-push`, khóa VAPID, lưu subscription vào `push_subscriptions`, service worker trong PWA | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |

Nội dung mẫu: `🔴 Độ đang live: <tiêu đề>` + link `youtube.com/watch?v=…`. Không gắn tag/mention Độ.
