---
name: ui-feature
description: Build or change a public page or component in mixi-fan-hub — live banner, countdown, calendar, video grids, intro ritual, floating live button, gift box of official links, timeline, gallery, themes, embers, PWA. Use for "trang", "component", "giao diện", "UI", "màn hình", or any item from the v2 spec (COMPONENTS.md).
---

# UI feature

## Before writing

- Next 16 is not the Next you know: read the relevant file in `node_modules/next/dist/docs/01-app/` first (caching, Image, metadata).
- The design source is `docs/design/COMPONENTS.md` (blocks, states, copy, motion) and `docs/design/brand.html` (tokens, icons, mascot, illustrations, skins). Follow them; never invent art. Assets are generated with `npm run brand` — if an icon the spec names is missing (see roadmap GĐ7 list), use a neutral placeholder and add it to that list.

## Where code goes (feature-first, docs/07-conventions.md)

- New block of the spec = new folder `src/features/<name>/` (`components/`, `lib/`, `hooks/`, `server/queries.ts`, `mock.ts`, `types.ts` as needed). The page in `src/app/**/page.tsx` only fetches and composes.
- Reusable, feature-agnostic UI goes to `src/shared/ui/` (Button, Card, Badge, Chip, EmptyState, PageHeader, `Icon*`, `Mascot`, `Illustration`, `Logo`). Check there before writing a new primitive.
- Colours by semantic name only (`bg-surface`, `text-accent`, `bg-steam/15`…), no hex, no `dark:` (dark only). Join classes with `cn()`.
- Any animation: follow the `motion` skill.

## Rules of this site (fan-site-guard checks these)

- No MixiGaming logo, avatar, fonts or brand colours as the site's identity. Video thumbnails from `i.ytimg.com` are fine. The mascot is an original character; never put real quotes of Độ in its mouth.
- Every outbound link to YouTube/shop/donate/fanpage points to the **official** destination, opens in a new tab with `rel="noopener noreferrer"`, and nothing on the site takes money.
- Videos are links, not embeds (ADR-002).
- The footer disclaimer stays on every page.

## Server/client split

- Pages are Server Components that read through `src/features/*/server/queries.ts` (cached). Never import `mock-data.ts` or Supabase directly in a page or component.
- Anything per-user (cookies) goes in a child component under `<Suspense>`; anything clock-dependent uses `useNow()` (null during SSR, so no hydration mismatch); live state uses `useLiveStatus()` (Realtime).
- Times: stored UTC, schedule in Vietnam time via `src/features/schedule/lib/schedule.ts`, shown in the viewer's zone.
- Images: `next/image` with hosts listed in `next.config.ts`.

## Interaction and motion

- Follow "Chuẩn UI 2026" in `docs/07-conventions.md` (WCAG 2.2 AA, Core Web Vitals budget, `lg` breakpoint with the phone tab bar, native popover/ViewTransition, no AI-default tells). For a new visual direction or a redesign, also load the `frontend-design` skill; for transitions between states or routes, `vercel-react-view-transitions`.
- Mobile-first, one column; test at 390 / 768 / 1366 px with no horizontal scroll.
- Respect `prefers-reduced-motion` (Tailwind `motion-safe:` / `motion-reduce:`): no particles, no pulse, jump to final states.
- Ask for permissions (notifications, calendar) only after a tap.
- `localStorage` only for per-device conveniences (intro shown today, guest RSVP), always in try/catch, and the page must work if it throws.
- Accessible names on icon buttons, `aria-pressed` on toggles, visible focus.

## Verify

- `npm test` for any new pure logic (countdown math, calendar links: put it in the feature's `lib/` with a test).
- `npm run smoke` (add the page to the page list and a stub-data marker).
- A screenshot at phone and desktop width if a browser tool is available; otherwise say it was not visually checked.
- Lighthouse on the production build (`npm run build && npx next start`), mobile and `--preset=desktop`: accessibility must stay 100 on the pages you touched (`web-quality-audit` skill). Kill any old `next start` first, or you measure a stale build.

Finish with `done-check`; run `fan-site-guard` and `next16-reviewer` on the diff.
