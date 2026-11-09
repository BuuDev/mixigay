<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project context

Read `docs/README.md` first. Before writing code read `docs/07-conventions.md`; before touching data or jobs read `docs/02-architecture.md` and `docs/03-data-model.md`. The current phase and its checklist are in `docs/05-roadmap.md` — tick items off there as they land. Hard rules: never call YouTube `search.list` from a scheduled job (quota), never use MixiGaming branding, link out to YouTube instead of embedding.
