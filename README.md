# Góc Fan Độ (mixi-fan-hub)

Web fan cho Độ Mixi: lịch stream, link live, video theo game, vlog, danh sách game đã chơi và fan đề xuất game.
**Trang do fan làm, không liên kết chính thức.** Mọi link ủng hộ trỏ về kênh chính chủ; trang không nhận tiền.

Stack: Next.js 16 (App Router, TS) + Tailwind v4. Dự kiến: Supabase (Postgres, realtime, Google auth, cron) + Vercel.

## Chạy

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Trạng thái: prototype giao diện

Toàn bộ dữ liệu là mẫu (`src/lib/mock-data.ts`, videoId giả). Trang đọc dữ liệu qua `src/lib/data.ts` – các hàm đều async để sau này thay bằng truy vấn Supabase mà không đổi trang.

| Trang | Đường dẫn | Ghi chú |
|---|---|---|
| Trang chủ | `/` | Banner live / đếm ngược buổi kế tiếp, video mới |
| Lịch stream | `/lich` | Lịch tuần theo giờ VN + giờ địa phương người xem |
| Video theo game | `/video` | Lọc theo game, sắp xếp theo lượt xem / mới nhất, mục "Chưa phân loại" |
| Vlog | `/vlog` | Một "game" đặc biệt (`isVlog`) trong cùng hệ phân loại |
| Đã chơi | `/da-choi` | Đang chơi / phá đảo / drop |
| Đề xuất game | `/de-xuat` | Upvote, lọc trạng thái, gợi ý trùng khi gõ, nhận appid Steam (chỉ lưu tạm trong trình duyệt) |

Logic đã dùng được cho bản thật: `src/lib/classify.ts` (gán game theo nhãn tay → từ khóa tiêu đề), `src/lib/schedule.ts` (tính buổi kế tiếp theo giờ VN UTC+7).

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

Giai đoạn tiếp theo: **Giai đoạn 1 – Nền móng** (test, CI, Supabase, đăng nhập Google).
