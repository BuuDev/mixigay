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
supabase gen types typescript --local > src/server/supabase/database.types.ts
```

Tài khoản là **tên Bộ Tộc + mã khóa**, không email, không Google ([ADR-013](08-decisions.md#adr-013)). `supabase/config.toml` đã tắt đăng ký công khai; chỉ server của app tạo được tài khoản (cần `SUPABASE_SERVICE_ROLE_KEY`).

**Chế độ mock:** khi `NEXT_PUBLIC_SUPABASE_URL` trống, mọi trang dùng `src/features/*/mock.ts`, đề xuất chỉ lưu trên trình duyệt, admin trả 404. CI build theo chế độ này.

**Chủ trang, admin và tài khoản chính chủ (không ai đăng ký, không ai đưa email):**
- **Chủ trang đầu tiên** (chính bạn): trong SQL editor chạy `select public.issue_invite('owner', 'ten-dang-nhap', 'Tên hiển thị');`. Lệnh trả về một token; mở `<SITE_URL>/moi/<token>`, tự đặt mã khóa là xong. Token chỉ hiện một lần, dùng một lần, hết hạn sau 48 giờ.
- **Anh Độ / team kênh / mod:** chủ trang vào `/admin/quan-tri`, chọn vai trò ("Chính chủ" hoặc "Quản trị viên"), nhập tên đăng nhập (ví dụ `domixi`) và tên hiển thị (ví dụ "Độ Mixi"), bấm "Tạo link mời", rồi gửi link riêng cho đúng người.
  - Người nhận mở link, **tự đặt mã khóa**. Không ai khác biết mã đó, kể cả chủ trang.
  - "Chính chủ" = quyền quản trị + huy hiệu "✓ Chính chủ" + được dùng các tên dành riêng ("Độ Mixi", "MixiGaming"…). Chỉ chọn sau khi đã xác nhận qua kênh chính thức (fanpage, Discord chính chủ).
  - Gửi link qua tin nhắn riêng, không đăng công khai. Lỡ lộ thì bấm "Hủy link" rồi tạo link mới.
  - Đổi máy hoặc quên mã khóa: chủ trang bỏ quyền tài khoản cũ rồi tạo link mời mới.

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
| `AUTH_HASH_SALT` | server | Chuỗi ngẫu nhiên dài, dùng để băm IP khi giới hạn tạo tài khoản / đăng nhập | 1 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | client / server | Cloudflare Turnstile (tùy chọn, chống bot khi tạo tài khoản) | 1 |
| `WEBSUB_SECRET` | server | `openssl rand -hex 32` | 4 |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` | server | @BotFather | 4 |
| `DISCORD_WEBHOOK_URL` | server | Discord → Kênh → Integrations → Webhooks | 4 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | server (public key cả client) | `npx web-push generate-vapid-keys` | 4 |

## Google Cloud (một project dùng chung)

1. Tạo project → bật **YouTube Data API v3** → tạo **API key**, giới hạn key chỉ cho YouTube Data API.

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
6. Supabase → Authentication → Sign In / Providers: **tắt "Allow new users to sign up"** (chỉ server của app tạo tài khoản), **Email provider: bật, "Confirm email": tắt** (địa chỉ là địa chỉ ảo `*.invalid`, chỉ dùng nội bộ cho mã khóa), **Anonymous sign-ins: tắt**, **Google: tắt**. **Tăng rate limit đăng nhập của Supabase** (Authentication → Rate Limits → sign-ins) lên khoảng 300 / 5 phút. Mọi lần đăng nhập đều đi từ server của app, nên Supabase thấy IP của Vercel chứ không thấy IP người dùng; app đã tự giới hạn theo người. Đặt `TURNSTILE_SECRET_KEY` trước khi mở cho fan, nếu không thì chỉ còn các giới hạn theo IP.

**Chủ trang mất mã khóa:** mở SQL editor:
1. `delete from public.admins where user_id = '<id>';`
2. `delete from public.account_logins where user_id = '<id>';` (thay `<id>` bằng id lấy từ `account_logins` theo tên đăng nhập);
3. `select public.issue_invite('owner', '<ten-moi>', 'Tên bạn');` rồi mở link mời mới.

Người khác mất mã khóa: chủ trang bỏ quyền tài khoản cũ ở `/admin/quan-tri` rồi tạo link mời mới.
7. Supabase Auth → URL Configuration: Site URL = domain production. Thêm `https://*-<team>.vercel.app/**` cho preview.
8. Vercel → Firewall: bật rate limit cho `POST` vào các trang có form (`/de-xuat`, `/nhac`) và `/api/steam/*` (ví dụ 30 request/phút/IP). DB đã giới hạn theo tài khoản; lớp này chặn script spam trước khi tới Supabase. Khi bị tấn công dồn dập: bật Attack Mode.

## Kiểm tra nhanh sau khi deploy

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/poll-live   # 200 + JSON trạng thái
curl -X POST https://<domain>/api/cron/poll-live                                          # 401
```
