# 06 – Cài đặt môi trường

## Yêu cầu

- Node.js 22+ (Vercel mặc định Node 24)
- npm (repo dùng `package-lock.json`, không trộn với pnpm/yarn)
- Docker (để chạy Supabase local, từ Giai đoạn 1)
- Supabase CLI: `brew install supabase/tap/supabase`
- (Tùy chọn) Vercel CLI: `npm i -g vercel`

## Chạy prototype (hiện tại, không cần gì thêm)

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build
```

## Từ Giai đoạn 1: Supabase local

```bash
supabase start                 # in ra API URL, anon key, service_role key
supabase db reset              # áp migrations + seed.sql
supabase migration new <ten>   # tạo migration mới trong supabase/migrations/
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

Google login local đã cấu hình sẵn trong `supabase/config.toml`, đọc `SUPABASE_AUTH_GOOGLE_CLIENT_ID` / `SUPABASE_AUTH_GOOGLE_SECRET` từ môi trường.

**Chế độ mock:** khi `NEXT_PUBLIC_SUPABASE_URL` trống, mọi trang dùng `src/lib/mock-data.ts`, đề xuất chỉ lưu trên trình duyệt, admin trả 404. CI build theo chế độ này.

**Cấp quyền admin:** chạy SQL `insert into public.admin_emails (email) values ('ban@gmail.com');`. Nếu tài khoản đã tồn tại thì được cấp ngay; nếu chưa thì được cấp lúc đăng nhập lần đầu.

## Biến môi trường

Copy `.env.example` → `.env.local` rồi điền. **Không commit `.env.local`** (đã có trong `.gitignore`).

| Biến | Phía | Lấy ở đâu | Từ GĐ |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | `supabase start` / Dashboard → Settings → API | 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | như trên | 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | **chỉ server** | như trên | 2 |
| `CRON_SECRET` | server | `openssl rand -hex 32` | 2 |
| `YOUTUBE_API_KEY` | server | Google Cloud → APIs → YouTube Data API v3 → Credentials | 2 |
| `YOUTUBE_CHANNEL_ID` | server | `channels.list?forHandle=` (xem 04) | 2 |
| `NEXT_PUBLIC_SITE_URL` | client + server | domain production, dùng cho sitemap/robots/metadata | 3 |
| `NEXT_PUBLIC_CONTACT_URL` | client | link liên hệ/gỡ nội dung trên trang Giới thiệu | 3 |
| `SUPABASE_AUTH_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_GOOGLE_SECRET` | chỉ Supabase CLI local | OAuth client (xem dưới) | 1 |
| `WEBSUB_SECRET` | server | `openssl rand -hex 32` | 4 |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` | server | @BotFather | 4 |
| `DISCORD_WEBHOOK_URL` | server | Discord → Kênh → Integrations → Webhooks | 4 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | server (public key cả client) | `npx web-push generate-vapid-keys` | 4 |

## Google Cloud (một project dùng chung)

1. Tạo project → bật **YouTube Data API v3** → tạo **API key**, giới hạn key chỉ cho YouTube Data API.
2. OAuth consent screen (External, scope `openid email profile`) → tạo **OAuth Client ID (Web)** → redirect URI `https://<ref>.supabase.co/auth/v1/callback` (và `http://127.0.0.1:54321/auth/v1/callback` cho local).

## Production

1. Tạo project Supabase (region Singapore gần VN nhất). Có thể tạo qua **Vercel Marketplace → Supabase** để env tự đồng bộ sang Vercel.
2. `supabase link --project-ref <ref>` rồi `supabase db push`.
3. Import repo vào Vercel (framework Next.js, mặc định). Thêm env cho Production + Preview.
4. Lưu URL app và `CRON_SECRET` vào Supabase Vault, rồi chạy `supabase/cron.sql` trong SQL editor. File này bật `pg_cron` + `pg_net` và lên lịch poll-live (mỗi phút) cùng sync-videos (mỗi 6 giờ). Nó cố ý **không** phải migration, để `supabase db reset` ở local không bắt đầu poll:

   ```sql
   select vault.create_secret('https://<domain>', 'app_url');
   select vault.create_secret('<giá trị CRON_SECRET>', 'cron_secret');
   ```

5. Backfill toàn kênh một lần (~120 đơn vị quota): `curl -X POST -H "Authorization: Bearer $CRON_SECRET" "https://<domain>/api/cron/sync-videos?full=1"`. Sau đó vào `/admin/game` gán playlist chính chủ cho game.
6. Supabase Auth → Providers → **Email: tắt** (chỉ dùng Google). DB cũng chỉ cấp admin cho email đã xác nhận, nhưng không nên để mở cửa đăng ký bằng email.
7. Supabase Auth → URL Configuration: Site URL = domain production. Thêm `https://*-<team>.vercel.app/**` cho preview.

## Kiểm tra nhanh sau khi deploy

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/poll-live   # 200 + JSON trạng thái
curl -X POST https://<domain>/api/cron/poll-live                                          # 401
```
