---
name: motion
description: Add or change any animation in mixi-fan-hub — the intro ritual (nhóm lửa), countdown, gift box lid, calendar popover, lightbox, embers, live pulse, list/vote feedback, page transitions. Use for "animation", "hiệu ứng", "chuyển động", "motion", "transition", "mở hộp", "màn nhóm lửa", "tàn lửa", or any COMPONENTS.md block with motion rules.
---

# Motion

Spec rules (docs/design/COMPONENTS.md, brand.html): **one big moment only — the intro ritual**; everything else answers a user action (open, close, confirm); `prefers-reduced-motion` must be honoured everywhere.

## Pick the layer

| Need | Layer | Where |
|---|---|---|
| Ambient loop, no interaction (embers, live pulse, shimmer) | **CSS keyframes** — zero JS | `src/shared/motion/motion.css`; component in `src/shared/motion/*.tsx` |
| Hover/press/colour feedback | **CSS transitions** (`transition-*`, `duration-150`, `ease-out`) | inline Tailwind classes |
| Enter/exit, state swaps, sequences, gestures (intro steps, gift box lid, popover, lightbox, vote count roll, list cascade) | **Motion** via `@/shared/motion` | feature component marked `"use client"` |
| Route-to-route / shared element morph (gallery thumb → lightbox page) | **React `<ViewTransition>`** — not enabled yet; read `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` and add an ADR before using | — |

## Rules

1. **Import only from `@/shared/motion`** (`m`, `AnimatePresence`, presets, tokens, `useReducedMotion`, `useInView`). ESLint blocks `motion/react` elsewhere. Use `m.*`, never `motion.*` — `LazyMotion strict` throws on `motion.*`.
2. **Reuse presets and tokens** (`fade`, `rise`, `pop`, `sheet`, `stagger()`, `press`, `duration`, `ease`, `spring`) before inventing values. A new reusable variant goes into `src/shared/motion/presets.ts`; a one-off stays in the feature. Keep CSS vars in `motion.css` and `tokens.ts` in sync.
3. **Animate `transform` and `opacity` only** (x/y/scale/rotate/opacity). No width/height/top/left/box-shadow animation in loops; `filter` sparingly. Layout animations (`layout`, `layoutId`) need `domMax` — switch `src/shared/motion/features.ts` only with an ADR (bundle cost).
4. **Reduced motion**:
   - CSS: put ambient animation behind `motion-safe:` or inside `@media (prefers-reduced-motion: no-preference)`; hide decorative layers under `reduce` (see `.td-embers`).
   - Motion: `MotionConfig reducedMotion="user"` already turns transforms into instant changes. For sequences (intro ritual) branch explicitly with `useReducedMotion()` and **jump to the final state** (spec §1).
5. **Hydration**: no randomness at render (`Math.random`) — derive from index (see `Embers`). Time-based visuals use `useNow()` (null on the server).
6. **State swaps** use `AnimatePresence mode="wait"` with a `key` per state (copy `src/features/live/components/live-hero.tsx`). Lists use a `stagger()` parent + `rise` children (copy `video-grid.tsx`); give the parent a `key` to replay on filter change.
7. **The intro ritual** (`features/intro`, when built): states `unlit → lighting (600–900 ms, duration.ritual) → status`; once per device per day via `localStorage` key `td.intro.<yyyy-mm-dd>` in try/catch; always a skip button; no other component may run a large animation while it is open (the floating live button hides).
8. **Performance budget**: Motion features load lazily (`MotionProvider`); keep server components server — wrap only the animated part in a small client component instead of turning a whole page into a client component.
9. **Accessibility**: animated status changes still announce (`aria-live="polite"` on the container); focus moves into popovers/lightboxes and back on close; `Escape` closes.

## Verify

- `npm test` for any timing/state logic you extracted (put it in the feature's `lib/` — e.g. countdown math).
- `npm run lint` (catches stray `motion/react` imports) and `npm run smoke`.
- Manually (or with a browser tool): the animation at 375 px and desktop, and once with reduced motion emulated — it must reach the same final state without moving. Say so if you could not check visually.

Finish with `done-check`.
