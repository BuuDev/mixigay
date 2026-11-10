---
name: admin-page
description: Add or change a page or action in the mixi-fan-hub admin area (/admin) — schedule overrides, special events, theme/skin by date, moderation queues, game/playlist mapping. Use for "trang quản trị", "admin", "cho admin sửa …", "duyệt".
---

# Admin page

## Non-negotiable

- **Every page calls `await requireAdmin()` on its first line.** The check in `src/app/admin/layout.tsx` is not enough: Next renders layouts and pages in parallel, so a page without its own check streams its content to anyone (this happened here; `npm run smoke` now catches it).
- **Every action** goes through `db()` in `src/features/*/admin/actions.ts` (it calls `requireAdmin()`), validates with zod, and throws on DB errors.
- Reads use `serverClient()` (the admin's session, RLS applies) — never the service-role client.
- After a write, `updateTag(...)` for every public tag the change affects.

## Steps

1. Page `src/app/admin/<section>/page.tsx` — copy `src/app/admin/lich/page.tsx`. Use the building blocks in `src/features/admin/ui.tsx` (`Section`, `GameSelect`, `input`, `primary`, `button`). Function over form; no client components unless unavoidable.
2. Action in `src/features/*/admin/actions.ts` — copy `addSlot` / `deleteSlot` (`.bind(null, id)` for row buttons).
3. Nav entry in `NAV` in `src/app/admin/layout.tsx`.
4. RLS: the table needs the `<table>_admin_write` policy (see the loop in the init migration) — `db-change` skill.
5. Smoke: add a string only this page renders to `adminMarkers` in `scripts/smoke.mjs`, and the path to the admin loop. `npm run smoke` must show it 404s without leaking.

Finish with `done-check`; run `rls-auditor` on the diff.
