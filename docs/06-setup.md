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

**Project dev trên cloud (không cần Docker)** — `mixi-fan-hub-dev`, ref `doxxrzoibwmyybutsama`, Singapore:
1. Đăng nhập và link: chạy `npx supabase@2 login` rồi `npx supabase@2 link --project-ref <ref>` **trong Terminal của máy** (cần TTY, không chạy được trong chat của agent).
2. Đẩy migration và seed: `npx supabase@2 db push --linked --include-seed`.
3. Đẩy cài đặt Auth từ `config.toml`: chạy `npx supabase@2 config diff` để xem trước, rồi `config push`.
4. Điền file env local theo `.env.example`. Key mới có dạng `sb_publishable_…` / `sb_secret_…`.
5. **Dữ liệu mẫu thật** (chỉ dùng cho project dev): `npm run seed:sample` nạp video thật của kênh, game Steam thật làm đề xuất, bài nhạc nịnh thật, lời nhắn và điểm danh của 6 tài khoản "Fan mẫu". Script không bịa quote, kết quả giải đấu hay phát ngôn của ai. Script chỉ chạy khi project được nêu rõ: `SEED_SAMPLE_ALLOW=<ref> npm run seed:sample` (localhost thì không cần), và chỉ đụng đúng 6 tài khoản `mau01…mau06` còn mang tên "Fan mẫu". Xóa bằng `SEED_SAMPLE_ALLOW=<ref> npm run seed:sample -- --remove`.
6. Kiểm tra toàn luồng bằng bộ Playwright E2E trong `e2e/` (xem mục [E2E (Playwright)](#e2e-playwright) bên dưới): `npm run build` rồi `npm run e2e`. Kịch bản `community.spec.ts` tạo các tài khoản `e2e…` qua giao diện và tự xóa khi xong.

## E2E (Playwright)

Bộ test nằm trong `e2e/`, cấu hình ở `playwright.config.ts`. Chạy bằng **Google Chrome có sẵn trên máy** (`channel: "chrome"`), không cần `npx playwright install`. Hai project: `desktop` (1366×900) và `phone` (390×844, cảm ứng).

| Spec | Chế độ | Nội dung |
|---|---|---|
| `public.spec.ts` | mock + dev | lịch tuần và thẻ trạng thái live không trống, lọc video theo game, menu "Thêm ▾", thanh tab điện thoại, `/thong-ke` 404, không lỗi console/hydration trên các trang chính |
| `radio.spec.ts` | mock + dev, desktop | đài nhạc nền phát Airport Lounge ở âm lượng 0.3 ngay khi mở trang hoặc muộn nhất ở cú chạm đầu (Chromium headless lúc cho lúc chặn tự phát), "Tắt hẳn nhạc" được nhớ, không phát trên `/gui-anh-do` |
| `community.spec.ts` | chỉ dev, desktop | đăng ký qua dialog → gửi đề xuất (chỉ tác giả thấy) → admin duyệt → fan thứ hai upvote, sai mã khóa, header admin không chồng chéo ở 1024/1366 px |

Test chạy trên **bản build production** ở cổng 3311. `webServer` tự chạy `npm run start -- -p 3311` nếu cổng còn trống, hoặc dùng lại server đang chạy. Vì vậy luôn build trước:

```bash
# Chế độ dev project (đọc file env local như Next.js): chạy cả 3 spec
npm run build
npm run e2e

# Chế độ mock: để trống URL Supabase cho CẢ lúc build lẫn lúc test (community.spec.ts tự bỏ qua)
NEXT_PUBLIC_SUPABASE_URL= npm run build
NEXT_PUBLIC_SUPABASE_URL= npm run e2e

# Chạy với một server khác (không tự khởi động server)
E2E_BASE_URL=http://localhost:3000 npm run e2e
npm run e2e -- --project=desktop e2e/public.spec.ts   # chỉ một project / một file
```

- Biến rỗng (`NEXT_PUBLIC_SUPABASE_URL=`) thắng file env local, nên bản build và bộ test cùng ở chế độ mock. Build và test phải cùng chế độ: bản build mock chạy với env dev sẽ làm `community.spec.ts` hỏng.
- `community.spec.ts` chỉ chạy khi có `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`, và **chỉ dùng với project dev**. Nó tạo tài khoản qua giao diện, dùng service role để tạo link mời admin (`issue_invite`) và làm "già" hồ sơ fan thứ hai (tài khoản dưới 24 giờ không vote được). `globalSetup`/`globalTeardown` xóa mọi tài khoản và lời mời có tên bắt đầu bằng `e2e`, cùng bộ đếm giới hạn đăng ký/đăng nhập của chính máy này (giới hạn 3 tài khoản/giờ/IP).
- Fixture `e2e/fixtures.ts` đặt `localStorage["gbt:bgm"] = "off"` trước mọi trang (đài nhạc nền phát mãi sẽ làm `networkidle` không bao giờ tới), trừ `radio.spec.ts`. Trang chủ có màn "Nhóm lửa": dùng `dismissIntro(page)`.
- Kết quả lỗi (ảnh chụp, trace) nằm ở `test-results/`, đã có trong `.gitignore`. Xem trace: `npx playwright show-trace test-results/<tên>/trace.zip`.

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
| `ADMIN_ALERT_TELEGRAM_CHAT_ID`, `ADMIN_ALERT_DISCORD_WEBHOOK_URL` | server | Nhóm/kênh **riêng của admin** (không phải kênh thông báo live cho fan). Cron `moderation-alert` 5 phút/lần báo khi ≥ 20 nội dung chờ duyệt hoặc ≥ 10 báo cáo trong 1 giờ, tối đa 1 tin/giờ mỗi loại; để trống thì không gửi | 8 |

## Google Cloud (một project dùng chung)

1. Tạo project → bật **YouTube Data API v3** → tạo **API key**, giới hạn key chỉ cho YouTube Data API.

## Production

1. Tạo project Supabase (region Singapore gần VN nhất). Có thể tạo qua **Vercel Marketplace → Supabase** để env tự đồng bộ sang Vercel.
2. `supabase link --project-ref <ref>` rồi `supabase db push`.
3. Import repo vào Vercel (framework Next.js, mặc định). Thêm env cho Production + Preview.
4. Lưu URL app và `CRON_SECRET` vào Supabase Vault, rồi chạy `supabase/cron.sql` trong SQL editor. File này bật `pg_cron` + `pg_net` và lên lịch poll-live (tick mỗi phút, chỉ gọi app khi hẹn giờ tới hạn, ADR-018) cùng sync-videos (mỗi 6 giờ). Nó cố ý **không** phải migration, để `supabase db reset` ở local không bắt đầu poll:

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
