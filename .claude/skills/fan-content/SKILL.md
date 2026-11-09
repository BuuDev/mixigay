---
name: fan-content
description: Build a feature where fans submit content in mixi-fan-hub — quotes with timestamps, fan art, the "Bức tường Bộ tộc" message wall, RSVP "Tối nay tôi có mặt", reports — with sign-in, rate limits, moderation queue, mock mode and tests. Use for "kho quote", "fan art", "lưu bút", "tường", "RSVP", "điểm danh", "cho fan gửi …".
---

# Fan-submitted content

Every such feature has the same five parts. The suggestions feature (`/de-xuat`) is the reference implementation — copy it.

| Part | Reference |
|---|---|
| Table + RLS + column grants + rate-limit trigger | `suggestions` in `supabase/migrations/20261109000000_init.sql` |
| Server Action (auth → zod → insert → `updateTag`) | `src/app/de-xuat/actions.ts` |
| Client UI with demo + live mode, optimistic update | `src/components/suggestion-board.tsx` |
| Page (cached public list + per-user part under `<Suspense>`) | `src/app/de-xuat/page.tsx` |
| Admin moderation | `src/app/admin/de-xuat/page.tsx` + `updateSuggestion` in `src/app/admin/actions.ts` |

## Rules

1. **Data** — follow the `db-change` skill. Fan rows start `approved = false` (or `hidden = false` when post-moderation is acceptable — decide per feature and write it in the roadmap item). Fans get a column grant for their text columns only.
2. **Limits** — rate limit in a trigger with an advisory lock; length checks in the table (`≤140` for wall messages per the v2 spec, `≤300` for quotes); a banned-words check in the action if the feature is public text.
3. **Anonymous visitors** — may never write to the DB. If the spec allows a guest action (RSVP "1 lần/thiết bị"), keep it in `localStorage` (wrapped in try/catch) and count it nowhere server-side.
4. **Action** — `getViewer()` first; zod-validate; never trust ids, status or counters from the form; map DB errors to Vietnamese messages; `updateTag` for the author's own new row, `revalidateTag(tag, "max")` for high-frequency actions (votes, RSVPs) so spam cannot keep emptying the shared cache.
5. **Rendering** — text as React children only (no `dangerouslySetInnerHTML`); user links with `rel="noopener noreferrer nofollow ugc"`; images only from hosts in `next.config.ts` `images.remotePatterns`.
6. **Uploads (fan art)** — Supabase Storage bucket with size (≤5 MB) and MIME (`image/*`) limits in the bucket policy, path `<user_id>/<uuid>`, only approved objects listed publicly; never proxy uploads through a Vercel Function (4.5 MB body limit).
7. **Timestamps (quotes)** — store `video_id` + `at_seconds`; link with `youtubeUrl(id) + "&t=" + s + "s"`; accept a pasted `?t=` link and parse it in `src/lib` with a test.
8. **Moderation** — admin page lists pending first; approve/hide/delete actions; mascot/empty states per `COMPONENTS.md` if the v2 design is in use.
9. **Mock mode** — the page must work without Supabase (demo data in `mock-data.ts`, local-only submit), as `SuggestionBoard` does.

## Tests

- `db:check`: fan inserts own row ✓; fan sets `approved`/`hidden` ✗; anon inserts ✗; N+1-th row in a day ✗; unapproved row invisible to others ✓.
- `smoke`: new page 200 and renders stub data; admin page leaks nothing anonymously (add its marker text to `adminMarkers` in `scripts/smoke.mjs`).
- Unit tests for any parsing (timestamps, links).

Finish with `done-check`, and run `fan-site-guard` + `rls-auditor` on the diff.
