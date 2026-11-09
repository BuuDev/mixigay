# 07 – Quy ước code

Rút từ code hiện có. Khi thấy code lệch với tài liệu này, hoặc phát hiện quy ước chưa được ghi, hãy sửa tài liệu trong cùng commit.

## Kiến trúc nguồn (feature-first)

```
src/
  app/                       # CHỈ routing: page/layout/route mỏng, ghép component của feature
    (route)/page.tsx         #   đọc dữ liệu qua features/*/server/queries.ts rồi render
    admin/*/page.tsx         #   await requireAdmin() + render <XAdmin/> của feature
    api/cron|steam|…         #   route handler mỏng, logic nằm trong feature/server
  features/<tính-năng>/      # mỗi tính năng tự chứa mọi thứ của nó
    types.ts                 #   kiểu domain
    mock.ts                  #   dữ liệu chế độ mock (không Supabase)
    lib/                     #   logic thuần + mapper Row→domain (*.test.ts cạnh file); client dùng được
    server/                  #   "server-only": queries (use cache), job, tích hợp ngoài
    actions.ts               #   Server Actions cho người dùng ("use server")
    hooks/                   #   hook client
    components/              #   UI của tính năng; file lớn tách thành nhiều component nhỏ
    admin/                   #   UI + actions quản trị của tính năng
  shared/                    # không biết gì về tính năng nào
    design/                  #   tokens.css (Góc Bộ Tộc), themes.generated.css (skin)
    motion/                  #   NƠI DUY NHẤT dùng thư viện animation: provider, presets, tokens, Embers, LiveDot
    ui/                      #   Button, Card, Badge, Chip, EmptyState, PageHeader, icon, brand-art (logo/mascot/minh họa)
    layout/                  #   SiteHeader, SiteFooter
    lib/ hooks/              #   format, text, links, env, cache-tags, use-now, use-debounced…
  server/                    # hạ tầng phía server, không biết tính năng: supabase, youtube, jobs (context/handler/cron-auth)
  proxy.ts
```

Tính năng hiện có: `live`, `schedule`, `videos` (gồm game và vlog), `played`, `suggestions`, `auth`, `admin`. Tính năng v2 (spec `docs/design/COMPONENTS.md`) mỗi khối là một folder mới: `intro`, `attendance`, `wall`, `support`, `timeline`, `gallery`, `themes`…

### Quy tắc phân tầng (ESLint chặn khi vi phạm)

| Từ | Được import | Không được import |
|---|---|---|
| `app/` | features, shared, server | thư viện animation |
| `features/x` | `features/y` (types, lib, components, server khi ở phía server), shared, server | `app/`, thư viện animation |
| `shared/` | `shared/` | features, server, app, thư viện animation (trừ `shared/motion`) |
| `server/` | `server/`, shared | features, app |

- Trong cùng tính năng: import tương đối (`../lib/mapper`). Giữa các tính năng hoặc tới shared/server: `@/…`.
- Không dùng barrel `index.ts` cho tính năng: barrel trộn code server và client làm vỡ bundle. Ngoại lệ duy nhất là `@/shared/motion`, một entry `"use client"`.
- Client component không import `features/*/server/*` (file `server-only`; build sẽ báo lỗi).

## File mẫu để copy

| Cần làm | Copy từ |
|---|---|
| Trang (route mỏng) | `src/app/video/page.tsx`; trang có phần theo user: `src/app/de-xuat/page.tsx` (Suspense) |
| Getter dữ liệu (use cache + mock) | `src/features/videos/server/queries.ts` |
| Mapper Row → domain (+ test) | `src/features/videos/lib/mapper.ts` |
| Logic thuần (+ test) | `src/features/schedule/lib/schedule.ts`, `src/features/live/lib/live.ts` |
| Component trình bày | `src/features/videos/components/video-card.tsx` |
| Component client nhiều trạng thái, có animation | `src/features/live/components/live-hero.tsx` |
| Hook client tách logic khỏi UI | `src/features/suggestions/hooks/use-suggestion-votes.ts` |
| Server Action cho fan (auth + zod + `updateTag`) | `src/features/suggestions/actions.ts` |
| Trang admin | `src/app/admin/lich/page.tsx` + `src/features/schedule/admin/{schedule-admin.tsx,actions.ts}` |
| Job cron | `src/features/live/server/poll-live.ts` + `src/app/api/cron/poll-live/route.ts` (bọc `cronRoute`) |
| UI primitive | `src/shared/ui/button.tsx`, `badge.tsx` |
| Animation | xem skill `motion` và `src/shared/motion/presets.ts` |

## Design system Góc Bộ Tộc

- Nguồn: `docs/design/brand.html` + `docs/design/COMPONENTS.md`. Asset (logo, mascot, minh họa, icon, skin) **được sinh ra** bằng `npm run brand` (`scripts/extract-brand.mjs`). Không sửa tay các file `*.generated.*` hay `public/brand/**`.
- Màu: chỉ dùng tên ngữ nghĩa (`bg-surface`, `text-muted`, `border-border`, `bg-accent`, `text-cleared`, `bg-steam/15`…), không hex trong component. Token gốc `--td-*` ở `src/shared/design/tokens.css`; skin theo dịp đổi các token đó qua `data-theme` trên `<html>`.
- `accent` (ember) cho hành động chính; `live` chỉ cho trạng thái phát sóng; không dùng hai màu này làm nền lớn.
- Chỉ có nền tối (theo brand). Không thêm `dark:` variant.
- Icon: `Icon*` từ `@/shared/ui/icons` (Phosphor duotone, `currentColor` + lớp nền `--td-icon-tint`, [ADR-010](08-decisions.md#adr-010)). Cần icon mới thì thêm vào file đó (import từ `@phosphor-icons/react/dist/ssr/<Tên>`), không vẽ tay, không import Phosphor trực tiếp trong component. Mascot/minh họa: `<Mascot pose>` / `<Illustration name>` / `<EmptyState art>` (file SVG tĩnh, không tốn JS).

## Đặt tên

- File: `kebab-case.ts(x)`. Component export: `PascalCase` (named export, không default, trừ `page.tsx` / `layout.tsx` / `route.ts`).
- Route URL: tiếng Việt không dấu, gạch nối (`/da-choi`, `/de-xuat`, `/thong-ke`).
- Nội dung UI viết tiếng Việt. Comment trong code và tên biến viết tiếng Anh.
- **Xưng hô lễ phép** (bảng trong `docs/research/2026-11-09-trends.md`): luôn “anh Độ” / “anh Độ Mixi” / “anh Moi”, “Kênh MixiGaming”, “Tộc Trưởng”, “Bộ Tộc” — như tên riêng; không gọi trống “Độ” (test `honorifics.test.ts` chặn). Trích tiêu đề video thì giữ nguyên văn. Tên trang luôn là “Góc Bộ Tộc”.
- Slug game: `kebab-case` tiếng Anh/không dấu (`gta-v`, `viewer-made`).
- Cột DB `snake_case`, kiểu TS `camelCase`. Việc map giữa hai bên làm trong `features/*/lib/mapper.ts`, không để lan ra component.

## Thời gian

- Lưu và truyền **UTC ISO string** / `timestamptz`.
- Lịch tuần lưu theo **giờ VN (UTC+7, không DST)**. Tính toán dùng `src/features/schedule/lib/schedule.ts`, không tự cộng giờ ở chỗ khác.
- Hiển thị theo múi giờ người xem dùng `src/shared/lib/format.ts`. Những gì phụ thuộc "bây giờ" ở client dùng `useNow()`, để tránh lỗi hydration mismatch.

## Dữ liệu

- Trang **không** import `mock.ts` hay Supabase trực tiếp, mà luôn đi qua `features/*/server/queries.ts`.
- Ghi dữ liệu qua Server Actions. Mỗi action tự kiểm tra auth và validate input (dùng `zod` khi bắt đầu có action đầu tiên).
- Service role client chỉ dùng trong `app/api/cron/**` và `app/api/webhooks/**` (thông qua `src/features/*/server/* + src/server/jobs/*`). **Ngoại lệ duy nhất:** `createSuggestion` ghi `steam_app_id`/`steam_data` mà chính server lấy từ Steam, sau khi bản ghi đã được insert bằng quyền của user. Muốn thêm ngoại lệ thì phải ghi vào đây.
- Cột do fan ghi được giới hạn bằng **column grant** (`grant insert (cột…)`), không chỉ bằng RLS. RLS lọc hàng chứ không lọc cột.
- Dữ liệu `jsonb` phải validate khi map (`src/features/*/lib/mapper.ts`), để một hàng hỏng không làm sập trang dùng chung cache.
- Trang admin: **mỗi page tự gọi `await requireAdmin()`** ở dòng đầu. Không dựa vào layout.
- Đọc dữ liệu trong `"use cache"` thì dùng `publicClient()` (không cookie). Đọc theo user thì dùng `serverClient()` và đặt dưới `<Suspense>`.

## Next.js 16

- Đây không phải Next 14/15. Đọc `node_modules/next/dist/docs/` trước khi dùng API mới.
- Cache Components đang bật: dùng `"use cache"` + `cacheLife` + `cacheTag`; `updateTag` trong Server Action, `revalidateTag(tag, 'max')` trong route handler. Không dùng `unstable_cache`, `export const revalidate`, `export const dynamic`.
- `proxy.ts` thay cho `middleware.ts`.
- Runtime Node.js mặc định. **Không** đặt `export const runtime = 'edge'`.

## Styling

- Tailwind v4: theme khai báo trong `src/shared/design/tokens.css` (`@theme inline`), không có `tailwind.config`.
- Không dùng màu/logo nhận diện của MixiGaming.
- Ghép class bằng `cn()` (`@/shared/ui/cn`).

## Kiểm tra trước khi commit

```bash
npm run lint
npm run typecheck   # next typegen && tsc --noEmit
npm test            # vitest
npm run db:check    # khi đổi supabase/
npm run smoke       # khi đổi trang/route/action/auth
npm run build
```

## Git

- Nhánh: `feat/…`, `fix/…`, `docs/…`, `chore/…`. Không commit thẳng vào `main`.
- Commit message theo Conventional Commits (`feat: …`, `fix: …`, `docs: …`).
- Không commit `.env*` (trừ `.env.example`).
