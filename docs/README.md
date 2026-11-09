# Tài liệu dự án – Góc Fan Độ

Đọc theo thứ tự này khi mới vào dự án:

| File | Nội dung | Khi nào đọc |
|---|---|---|
| [01-product.md](01-product.md) | Mục tiêu, phạm vi, danh sách tính năng có ưu tiên, nguyên tắc web fan | Trước khi làm bất kỳ tính năng nào |
| [02-architecture.md](02-architecture.md) | Kiến trúc, luồng dữ liệu, chiến lược poll YouTube và ngân sách quota, cache | Trước khi đụng vào phần backend / job |
| [03-data-model.md](03-data-model.md) | Schema Supabase (SQL), RLS, realtime | Trước khi viết migration |
| [04-integrations.md](04-integrations.md) | YouTube Data API, WebSub, Steam, Google OAuth, Telegram/Discord, Web Push | Khi làm tích hợp bên ngoài |
| [05-roadmap.md](05-roadmap.md) | Các giai đoạn, task checklist, tiêu chí hoàn thành | Lên kế hoạch sprint, chọn việc tiếp theo |
| [06-setup.md](06-setup.md) | Cài môi trường, biến môi trường, tạo Supabase / Google / YouTube key, deploy | Ngày đầu tiên |
| [07-conventions.md](07-conventions.md) | Quy ước code, cấu trúc thư mục, file mẫu để copy | Trước khi viết code |
| [08-decisions.md](08-decisions.md) | Nhật ký quyết định kiến trúc (ADR) | Khi muốn biết "tại sao lại làm thế này" |
| [design/](design/) | `brand.html` (nhận diện Góc Bộ Tộc v2) và `COMPONENTS.md` (đặc tả khối giao diện) | Trước khi làm giao diện/animation |
| [research/](research/) | Khảo sát trend, nguồn cho content (ví dụ `2026-11-09-trends.md`) | Trước khi thêm content theo trend |
| [09-ai-tooling.md](09-ai-tooling.md) | Skill, subagent, workflow của Claude Code; `db:check`, `smoke` | Trước khi giao việc cho agent |

Nguyên tắc giữ tài liệu: khi code thay đổi làm sai một đoạn ở đây, sửa đoạn đó **trong cùng commit**.
