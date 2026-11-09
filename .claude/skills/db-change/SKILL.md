---
name: db-change
description: Add or change a Supabase table, column, RLS policy, trigger or SQL function in mixi-fan-hub, end to end — migration, column grants, row types, mappers, data layer, seed, RLS assertions, docs. Use for "thêm bảng", "sửa schema", "thêm policy", "migration", "RLS", or any feature that needs new data.
---

# Database change

Source of truth: `supabase/migrations/*.sql`. Supabase grants `anon`/`authenticated` every privilege on new tables and functions by default — **RLS filters rows, column grants filter columns, REVOKE narrows functions**. Assume nothing is protected until a policy, grant or revoke says so.

## Steps

1. **New migration, never edit an applied one.** File `supabase/migrations/<YYYYMMDDHHMMSS>_<what>.sql` (or `supabase migration new <what>` when the CLI is installed). The init migration may still be edited only while nothing is deployed — check `docs/05-roadmap.md` GĐ1 "(cần bạn)" item; once production exists, always add a new file.
2. **Table checklist** — for each table write all of:
   - constraints in the table (`check (char_length(x) between …)`, `url ~* '^https?://'`, enums) — the DB is the last line of defence;
   - `alter table … enable row level security;` and one policy per verb that should be allowed;
   - for tables fans write: `revoke insert, update on … from anon, authenticated;` then `grant insert (only, the, fan, columns) …` — status/moderation/counter/`*_id` columns must not be in the list;
   - rate limits as a `before insert` trigger with `pg_advisory_xact_lock(hashtext('<table>:' || auth.uid()::text))` (copy `limit_suggestions_per_day`), not a count inside a policy (races);
   - read policies that hide moderated rows (`approved`/`hidden`) from everyone but the author and admins;
   - `alter publication supabase_realtime add table …` only if a client subscribes.
3. **Functions**: `set search_path = ''` and fully qualified names. `security definer` only when it must bypass RLS, and then `revoke execute … from public, anon, authenticated` + explicit `grant execute … to service_role`. Prefer `security invoker` so RLS keeps applying (see `set_auto_game`).
4. **App side**, in this order:
   - row shape in `src/features/*/lib/mapper.ts`;
   - mapper in `src/features/*/lib/mapper.ts` (+ test in `map.test.ts`); validate any `jsonb` column's shape there;
   - app type in `src/features/*/types.ts`;
   - getter in `src/features/*/server/queries.ts` with both branches: mock (`mock-data.ts`) and Supabase (`publicClient()` inside `"use cache"` + `cacheTag`); add the tag to `TAGS`.
5. **Seed**: extend `supabase/seed.sql` so local dev shows the feature.
6. **Assertions**: add to `scripts/check-sql.mjs` — at least one `allowed(...)` for the intended writer and one `denied(...)` for each of: anon, another fan, a fan writing a protected column, the rate limit. Then `npm run db:check`.
7. **Docs**: `docs/03-data-model.md` (RLS table + notes).

## Gotchas already hit in this repo

- `unaccent()` is not IMMUTABLE → use `public.f_unaccent()` in generated columns/indexes.
- Extensions live in schema `extensions` (`extensions.gin_trgm_ops`).
- `revoke … from public` also strips `authenticated`'s execute; re-grant explicitly.
- Admin rights only for **confirmed** emails (`grant_admin_if_listed`).
- PostgREST returns many-to-one embeds as objects; the untyped client types them as arrays — assert with `check<Row[]>()` in `data.ts`.

Finish with the `done-check` skill.
