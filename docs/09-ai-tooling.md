# 09 – Skill, subagent, workflow (Claude Code)

Bộ công cụ giúp agent (và người) làm việc trên repo này theo đúng luật của dự án. Tất cả nằm trong `.claude/` và được commit cùng code.

```
Yêu cầu ──► plan-feature (workflow, tùy chọn) ──► skill phù hợp ──► code
                                                     │
                                                     ▼
                                done-check (skill): lint · typecheck · test · db:check · smoke · build
                                                     │
                                                     ▼
                             review-changes (workflow): 4 reviewer dự án + correctness → refute
                                                     │
                                                     ▼
                                         commit trên `developer`
                                                     │
                                       release-check (workflow) trước khi lên main/production
```

## 1. Lệnh kiểm chứng (nền móng: skill và agent dựa vào chúng)

| Lệnh | Làm gì | Khi nào |
|---|---|---|
| `npm run db:check` | Áp mọi migration + seed vào Postgres trong bộ nhớ (PGlite), giả lập default privileges của Supabase, rồi chạy ~50 assertion RLS/grant/trigger (`scripts/check-sql.mjs`) | Mọi thay đổi trong `supabase/` |
| `npm run smoke` | Build ở chế độ Supabase với stub REST/Auth, chạy `next start`, gọi mọi route như khách: trang có dữ liệu, admin 404 và **không lộ nội dung**, cron đòi secret, redirect không ra ngoài (`scripts/smoke.mjs`) | Mọi thay đổi trang/route/action/auth |

Cả hai đã bắt được lỗi thật khi xây dựng: page admin stream nội dung cho khách, và `revoke … from public` thu luôn quyền của `authenticated`.

## 2. Skill (`.claude/skills/*/SKILL.md`)

Quy trình cho một loại việc lặp lại. Agent tự nạp skill khi yêu cầu khớp với description (có trigger tiếng Việt).

| Skill | Dùng khi | Điểm chính |
|---|---|---|
| `done-check` | Cuối mọi task | Bảng lệnh phải xanh, reviewer theo vùng file, cập nhật roadmap/docs cùng commit |
| `db-change` | Thêm/sửa bảng, policy, hàm | Migration mới, **column grant** cho cột fan ghi, rate limit bằng trigger + advisory lock, assertion trong `db:check` |
| `fan-content` | Quote, fan art, tường lưu bút, RSVP | Mẫu 5 phần copy từ `/de-xuat`; duyệt nội dung; mock mode; upload qua Storage |
| `youtube-job` | Cron, poll, sync, WebSub, thông báo, thống kê | Bảng quota, cấm `search.list`, `cronRoute`, idempotent, claim-before-send |
| `admin-page` | Trang/action trong `/admin` | `requireAdmin()` ở **từng page**, thêm marker vào smoke |
| `ui-feature` | Trang/component công khai, các mục spec v2 (`COMPONENTS.md`) | Luật web fan, tách server/client, reduced motion, mobile-first |

## 3. Subagent (`.claude/agents/*.md`)

Reviewer chỉ đọc, mỗi agent một mảng rủi ro riêng của dự án. Tất cả trả kết quả cùng format `[mức] file:dòng — nhận định`, kèm kịch bản cụ thể và cách sửa.

| Agent | Soi gì |
|---|---|
| `rls-auditor` | Ai đọc/ghi được gì qua PostgREST (bỏ qua app), column grant, security definer, admin theo email đã xác nhận, các chỗ dùng service role |
| `next16-reviewer` | `"use cache"`/tag/`updateTag` vs `revalidateTag(…, "max")`, cookies dưới Suspense, export của route, server-only, mock mode |
| `fan-site-guard` | Thương hiệu, disclaimer, tiền, link chính chủ, không embed, nội dung fan, quyền riêng tư, UX v2 |
| `quota-auditor` | Đơn vị YouTube/ngày, giới hạn Steam, vòng lặp không chặn, idempotency, tốc độ tăng dữ liệu |

Gọi riêng: "dùng rls-auditor review diff này". Subagent mới tạo cần **khởi động lại phiên** Claude Code thì mới xuất hiện trong danh sách.

## 4. Workflow (`.claude/workflows/*.js`)

Điều phối nhiều agent theo cách cố định. Chỉ chạy khi bạn yêu cầu, vì mỗi lần tốn nhiều token.

| Workflow | Args | Pha | Kết quả |
|---|---|---|---|
| `review-changes` | `{ diff?, intent? }` | 5 reviewer song song → gộp trùng → 3 agent cố bác bỏ mỗi lỗi high/critical, đa số quyết định | `verdict` BLOCK/OK, `confirmed`, `refuted`, `minor`, `notCovered` |
| `plan-feature` | `{ feature }` | 3 scout (data/UI/jobs) → 2 bản plan (tối giản / bền vững) → judge chấm và gộp | Một plan theo format cố định, dừng trước khi code để người duyệt |
| `release-check` | `{ base? = "main" }` | Chạy gate → `review-changes` trên `base...HEAD` → kiểm tra env, migration, cron, auth, roadmap | `READY` / `NOT READY` + các bước tay cho production. Không bao giờ deploy |

Ví dụ: *"chạy workflow plan-feature cho GĐ6 kho quote"*, *"chạy review-changes"*, *"release-check trước khi merge vào main"*.

Cỡ: `review-changes` ≈ 5 agent + 3 cho mỗi lỗi high. `plan-feature` = 6 agent. `release-check` ≈ 2 agent + một lần `review-changes`.

## Bảo trì

- Gặp lỗi mới mà một skill lẽ ra phải ngăn được: thêm vào mục "Gotchas" của skill đó, **và** thêm assertion vào `db:check` hoặc `smoke` nếu lỗi kiểm chứng được bằng máy.
- Thêm loại việc mới lặp lại từ 2 lần trở lên: tạo skill mới, rồi thêm dòng vào bảng ở trên và vào `done-check` nếu nó cần reviewer riêng.
