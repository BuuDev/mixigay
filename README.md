# Góc Fan Độ (mixi-fan-hub)

Web fan cho Độ Mixi: lịch stream, link live, video theo game, vlog, danh sách game đã chơi và fan đề xuất game.
**Trang do fan làm, không liên kết chính thức.** Mọi link ủng hộ trỏ về kênh chính chủ; trang không nhận tiền.

Stack: Next.js 16 (App Router, TS, Cache Components) + Tailwind v4, Supabase (Postgres, RLS, Realtime, Google auth, pg_cron), deploy trên Vercel.

## Chạy

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Hai chế độ chạy

- **Mock (mặc định, không cần cấu hình):** không có `NEXT_PUBLIC_SUPABASE_URL` thì mọi trang đọc `src/lib/mock-data.ts` (videoId giả), đề xuất chỉ lưu trên trình duyệt, đăng nhập và admin tắt. CI build theo chế độ này.
- **Supabase:** điền `.env.local` theo [docs/06-setup.md](docs/06-setup.md). Khi đó có dữ liệu thật, đăng nhập Google, upvote, trang `/admin`, và job cron lấy dữ liệu YouTube.

| Trang | Đường dẫn | Ghi chú |
|---|---|---|
| Trang chủ | `/` | Banner live / sắp live / đếm ngược (realtime), video mới |
| Lịch stream | `/lich` | Lịch tuần theo giờ VN + giờ địa phương người xem |
| Video theo game | `/video` | Lọc theo game, sắp theo lượt xem / mới nhất, mục "Chưa phân loại" |
| Vlog | `/vlog` | Một "game" đặc biệt (`isVlog`) trong cùng hệ phân loại |
| Đã chơi | `/da-choi` | Đang chơi / phá đảo / drop, đánh dấu game do fan đề xuất |
| Đề xuất game | `/de-xuat` | Đăng nhập Google, upvote, gợi ý trùng, tự lấy thông tin từ link Steam |
| Giới thiệu | `/gioi-thieu` | Ghi rõ không chính thức, liên hệ gỡ nội dung |
| Quản trị | `/admin` | Lịch, gán game cho video, từ khóa, playlist, đề xuất, "Đã chơi", quota |
| Job | `POST /api/cron/poll-live`, `POST /api/cron/sync-videos` | Gọi bởi Supabase `pg_cron` (`supabase/cron.sql`), cần `CRON_SECRET` |

```bash
npm test          # vitest
npm run typecheck # next typegen && tsc
```

## Tài liệu & lộ trình

Toàn bộ kế hoạch nằm trong [`docs/`](docs/README.md):

- [Sản phẩm & ưu tiên tính năng](docs/01-product.md)
- [Kiến trúc, poll YouTube, ngân sách quota, cache](docs/02-architecture.md)
- [Schema Supabase + RLS](docs/03-data-model.md)
- [Tích hợp: YouTube, WebSub, Steam, Google OAuth, Telegram/Discord/Web Push](docs/04-integrations.md)
- [Lộ trình theo giai đoạn (checklist)](docs/05-roadmap.md)
- [Cài đặt môi trường & biến môi trường](docs/06-setup.md) (mẫu: `.env.example`)
- [Quy ước code](docs/07-conventions.md)
- [Nhật ký quyết định (ADR)](docs/08-decisions.md)

Trạng thái: code GĐ1–3 đã xong và Telegram/Discord của GĐ4 đã có. Việc còn lại xem [lộ trình](docs/05-roadmap.md). Các mục cần bạn làm tay được đánh dấu **(cần bạn)**.
