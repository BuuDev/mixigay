# 07 – Quy ước code

Rút từ code hiện có. Khi thấy code lệch với tài liệu này, hoặc phát hiện quy ước chưa được ghi, hãy sửa tài liệu trong cùng commit.

## File mẫu để copy

| Cần làm | Copy từ |
|---|---|
| Trang Server Component đọc dữ liệu | `src/app/lich/page.tsx`, `src/app/video/page.tsx` |
| Component client có state | `src/components/suggestion-board.tsx`, `src/components/video-browser.tsx` |
| Component hiển thị thuần | `src/components/video-card.tsx` |
| Hàm logic thuần (có test) | `src/lib/classify.ts`, `src/lib/schedule.ts` |
| Getter dữ liệu (cache + mock fallback) | `src/lib/data.ts` |
| Hook client | `src/lib/use-now.ts`, `src/lib/use-live-status.ts` |
| Server Action cho fan (auth + zod + `updateTag`) | `src/app/de-xuat/actions.ts` |
| Trang admin (form + action) | `src/app/admin/lich/page.tsx` + `src/app/admin/actions.ts` |
| Job cron | `src/lib/jobs/poll-live.ts` + `src/app/api/cron/poll-live/route.ts` (bọc bằng `cronRoute`) |
| Test | `src/lib/live.test.ts` (đặt cạnh file, tên `*.test.ts`) |

## Cấu trúc thư mục

```
src/
  app/<route-tiếng-việt-không-dấu>/page.tsx   # /lich, /video, /vlog, /da-choi, /de-xuat
  app/<route>/actions.ts                      # Server Actions của route đó ("use server")
  app/api/cron/<job>/route.ts                 # job, bảo vệ bằng CRON_SECRET
  app/api/webhooks/<nguồn>/route.ts
  app/admin/...                               # trang quản trị
  components/<kebab-case>.tsx                 # component dùng chung
  lib/                                        # logic thuần, types, data access
  lib/supabase/                               # client Supabase + database.types.ts
  lib/youtube/                                # client YouTube API
supabase/migrations/, supabase/seed.sql
docs/
```

## Đặt tên

- File: `kebab-case.ts(x)`. Component export: `PascalCase` (named export, không default, trừ `page.tsx` / `layout.tsx` / `route.ts`).
- Route URL: tiếng Việt không dấu, gạch nối (`/da-choi`, `/de-xuat`, `/thong-ke`).
- Nội dung UI viết tiếng Việt. Comment trong code và tên biến viết tiếng Anh.
- Slug game: `kebab-case` tiếng Anh/không dấu (`gta-v`, `viewer-made`).
- Cột DB `snake_case`, kiểu TS `camelCase`. Việc map giữa hai bên làm trong `data.ts`, không để lan ra component.

## Thời gian

- Lưu và truyền **UTC ISO string** / `timestamptz`.
- Lịch tuần lưu theo **giờ VN (UTC+7, không DST)**. Tính toán dùng `src/lib/schedule.ts`, không tự cộng giờ ở chỗ khác.
- Hiển thị theo múi giờ người xem dùng `src/lib/format.ts`. Những gì phụ thuộc "bây giờ" ở client dùng `useNow()`, để tránh lỗi hydration mismatch.

## Dữ liệu

- Trang **không** import `mock-data.ts` hay Supabase trực tiếp, mà luôn đi qua `src/lib/data.ts`.
- Ghi dữ liệu qua Server Actions. Mỗi action tự kiểm tra auth và validate input (dùng `zod` khi bắt đầu có action đầu tiên).
- Service role client chỉ dùng trong `app/api/cron/**` và `app/api/webhooks/**` (thông qua `src/lib/jobs/*`). **Ngoại lệ duy nhất:** `createSuggestion` ghi `steam_app_id`/`steam_data` mà chính server lấy từ Steam, sau khi bản ghi đã được insert bằng quyền của user. Muốn thêm ngoại lệ thì phải ghi vào đây.
- Cột do fan ghi được giới hạn bằng **column grant** (`grant insert (cột…)`), không chỉ bằng RLS. RLS lọc hàng chứ không lọc cột.
- Dữ liệu `jsonb` phải validate khi map (`src/lib/supabase/map.ts`), để một hàng hỏng không làm sập trang dùng chung cache.
- Trang admin: **mỗi page tự gọi `await requireAdmin()`** ở dòng đầu. Không dựa vào layout.
- Đọc dữ liệu trong `"use cache"` thì dùng `publicClient()` (không cookie). Đọc theo user thì dùng `serverClient()` và đặt dưới `<Suspense>`.

## Next.js 16

- Đây không phải Next 14/15. Đọc `node_modules/next/dist/docs/` trước khi dùng API mới.
- Cache Components đang bật: dùng `"use cache"` + `cacheLife` + `cacheTag`; `updateTag` trong Server Action, `revalidateTag(tag, 'max')` trong route handler. Không dùng `unstable_cache`, `export const revalidate`, `export const dynamic`.
- `proxy.ts` thay cho `middleware.ts`.
- Runtime Node.js mặc định. **Không** đặt `export const runtime = 'edge'`.

## Styling

- Tailwind v4 (cấu hình trong `globals.css`, không có `tailwind.config`).
- Không dùng màu/logo nhận diện của MixiGaming.

## Kiểm tra trước khi commit

```bash
npm run lint
npm run typecheck   # next typegen && tsc --noEmit
npm test            # vitest
npm run build
```

## Git

- Nhánh: `feat/…`, `fix/…`, `docs/…`, `chore/…`. Không commit thẳng vào `main`.
- Commit message theo Conventional Commits (`feat: …`, `fix: …`, `docs: …`).
- Không commit `.env*` (trừ `.env.example`).
