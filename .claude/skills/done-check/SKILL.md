---
name: done-check
description: Definition of done for mixi-fan-hub — the exact checks to run before calling any change finished or asking to commit, plus the docs/roadmap bookkeeping. Use at the end of every task in this repo ("xong chưa", "kiểm tra trước khi commit", "verify", "ready to commit?").
---

# Done check

A change in this repo is done only when every applicable line below is green **in this turn**. Report each with its evidence (pass counts, `DB_CHECK=pass`, `SMOKE=pass`).

## 1. Gates

| Command | When | Green means |
|---|---|---|
| `npm run lint` | always | no errors, no new warnings |
| `npm run typecheck` | always | exit 0 (runs `next typegen` first, so new routes are typed) |
| `npm test` | always | 0 failed; new pure logic has a `*.test.ts` next to it |
| `npm run db:check` | anything under `supabase/` changed | `DB_CHECK=pass`, **and** your new rule has an assertion in `scripts/check-sql.mjs` |
| `npm run smoke` | a page, route, action, auth, proxy or admin file changed | `SMOKE=pass` (builds in Supabase mode against a stub, checks every route anonymously) |
| `npm run build` | always (smoke already builds in Supabase mode; this one is mock mode, as CI runs it) | exit 0 |

Never weaken an assertion to get green. If a check is wrong, fix the check and say why.

## 2. Review

Large or risky diffs (auth, RLS, server actions, cron, anything touching money/links/branding): run the `review-changes` workflow, or at minimum the matching reviewer subagent:

| Touched | Subagent |
|---|---|
| `supabase/**`, `src/app/**/actions.ts`, `src/lib/auth.ts`, `src/app/admin/**` | `rls-auditor` |
| any `src/app/**` or `src/lib/data.ts`, caching, `proxy.ts` | `next16-reviewer` |
| UI text, links, images, fan-submitted content | `fan-site-guard` |
| `src/lib/youtube/**`, `src/lib/jobs/**`, `supabase/cron.sql`, Steam calls | `quota-auditor` |

Fix every critical/high finding, then re-run section 1.

## 3. Bookkeeping (same commit)

- Tick the item in `docs/05-roadmap.md`; add a new unchecked item for anything you found but did not do.
- If you changed a table, policy or function: update `docs/03-data-model.md`.
- If you added a convention or an exception (e.g. a new service-role use): `docs/07-conventions.md`.
- A real architectural choice: a new ADR in `docs/08-decisions.md`.
- New env var: `.env.example` **and** the table in `docs/06-setup.md`.

## 4. Commit

Branch `developer` (never `main`). Conventional commit subject explaining *why*. Ask before committing unless the user already said to commit.
