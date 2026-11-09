---
name: ui-feature
description: Build or change a public page or component in mixi-fan-hub — live banner, countdown, calendar, video grids, intro ritual, floating live button, gift box of official links, timeline, gallery, themes, embers, PWA. Use for "trang", "component", "giao diện", "UI", "màn hình", or any item from the v2 spec (COMPONENTS.md).
---

# UI feature

## Before writing

- Next 16 is not the Next you know: read the relevant file in `node_modules/next/dist/docs/01-app/` first (caching, Image, metadata).
- If the work comes from the v2 design spec ("Tộc Đêm", `COMPONENTS.md`), follow it for states, copy, icons, tokens and motion. If the spec or its assets (`tokens/`, `icons/`, `illustrations/`, `mascot/`) are not in the repo, ask the user for them instead of inventing art.

## Rules of this site (fan-site-guard checks these)

- No MixiGaming logo, avatar, fonts or brand colours as the site's identity. Video thumbnails from `i.ytimg.com` are fine. The mascot is an original character; never put real quotes of Độ in its mouth.
- Every outbound link to YouTube/shop/donate/fanpage points to the **official** destination, opens in a new tab with `rel="noopener noreferrer"`, and nothing on the site takes money.
- Videos are links, not embeds (ADR-002).
- The footer disclaimer stays on every page.

## Server/client split

- Pages are Server Components that read through `src/lib/data.ts` (cached). Never import `mock-data.ts` or Supabase directly in a page or component.
- Anything per-user (cookies) goes in a child component under `<Suspense>`; anything clock-dependent uses `useNow()` (null during SSR, so no hydration mismatch); live state uses `useLiveStatus()` (Realtime).
- Times: stored UTC, schedule in Vietnam time via `src/lib/schedule.ts`, shown in the viewer's zone.
- Images: `next/image` with hosts listed in `next.config.ts`.

## Interaction and motion

- Mobile-first, one column; test at 375 px and desktop.
- Respect `prefers-reduced-motion` (Tailwind `motion-safe:` / `motion-reduce:`): no particles, no pulse, jump to final states.
- Ask for permissions (notifications, calendar) only after a tap.
- `localStorage` only for per-device conveniences (intro shown today, guest RSVP), always in try/catch, and the page must work if it throws.
- Accessible names on icon buttons, `aria-pressed` on toggles, visible focus.

## Verify

- `npm test` for any new pure logic (countdown math, calendar links: put it in `src/lib` with a test).
- `npm run smoke` (add the page to the page list and a stub-data marker).
- A screenshot at phone and desktop width if a browser tool is available; otherwise say it was not visually checked.

Finish with `done-check`; run `fan-site-guard` and `next16-reviewer` on the diff.
