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

Bật Google login local: thêm `[auth.external.google]` vào `supabase/config.toml` với `client_id` / `secret = "env(SUPABASE_AUTH_GOOGLE_SECRET)"`.

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
| `ADMIN_EMAILS` | server | danh sách email cách nhau dấu phẩy, dùng để seed bảng `admins` | 3 |
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
4. Supabase → Database → Extensions: bật `pg_cron`, `pg_net`. Chạy SQL lên lịch (đặt trong migration):

   ```sql
   select cron.schedule('poll-live', '* * * * *', $$
     select net.http_post(
       url := 'https://<domain>/api/cron/poll-live',
       headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'))
     );
   $$);
   select cron.schedule('sync-videos', '0 */6 * * *', $$ ... '/api/cron/sync-videos' ... $$);
   ```

   Lưu `CRON_SECRET` vào Supabase Vault (`select vault.create_secret('<giá trị>', 'cron_secret');`), không viết thẳng vào SQL.
5. Supabase Auth → URL Configuration: Site URL = domain production. Thêm `https://*-<team>.vercel.app/**` cho preview.

## Kiểm tra nhanh sau khi deploy

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/poll-live   # 200 + JSON trạng thái
curl -X POST https://<domain>/api/cron/poll-live                                          # 401
```
