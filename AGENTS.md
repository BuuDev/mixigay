<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project context

Read `docs/README.md` first. Before writing code read `docs/07-conventions.md`; before touching data or jobs read `docs/02-architecture.md` and `docs/03-data-model.md`. The current phase and its checklist are in `docs/05-roadmap.md` — tick items off there as they land. Hard rules: never call YouTube `search.list` from a scheduled job (quota), link out to YouTube instead of embedding. MixiGaming / Refund Gaming logos and anh Độ's photos may be used, including as site identity (owner-confirmed permission, ADR-016), but the footer must keep saying the site is fan-made and not the official channel.

Tooling (details in `docs/09-ai-tooling.md`):
- Source layout is feature-first (`src/app` routing only → `src/features/<x>` → `src/shared`, `src/server`); ESLint enforces the layering. Design source: `docs/design/` (brand.html, COMPONENTS.md); regenerate assets with `npm run brand`.
- Skills in `.claude/skills/`: `db-change`, `fan-content`, `youtube-job`, `admin-page`, `ui-feature`, `motion`, and `done-check` — run `done-check` at the end of every task.
- Subagents in `.claude/agents/`: read-only reviewers `rls-auditor`, `next16-reviewer`, `fan-site-guard`, `quota-auditor`; parallel builders `implementer`, `test-writer`; `fable-analyst` for deep technical analysis.
- Models: Opus is the default for every subagent and workflow agent. Use Fable (`fable-analyst`, or `model: "fable"` anywhere) only when the user has asked for it or approved it in this conversation; `.claude/hooks/fable-gate.sh` turns any Fable call into a permission prompt.
- Go parallel when there are 3+ independent units: send independent agents in one message, give each a disjoint set of files, run the gate once at the end.
- Workflows in `.claude/workflows/` (run only when the user asks): `plan-feature`, `parallel-implement`, `review-changes`, `release-check`.
- Verification beyond tests: `npm run db:check` (migrations + RLS on PGlite) and `npm run smoke` (built app against a Supabase stub).
- Work happens on branch `developer`.
