export const meta = {
  name: 'plan-feature',
  description: 'Turn one roadmap item or v2-spec component into a reviewed implementation plan: scout the repo, draft two plans, judge and merge',
  whenToUse: 'Before building a non-trivial feature on mixi-fan-hub (new table, new page, new job). Stops at the plan so a human can redirect before code is written. args: { feature: "e.g. GĐ6 kho quote, or COMPONENTS.md §4 RSVP" }',
  phases: [
    { title: 'Scout', detail: 'data, UI and jobs/integrations read in parallel' },
    { title: 'Draft', detail: 'minimal plan and robust plan, independently' },
    { title: 'Judge', detail: 'score both against project rules, merge into one plan' },
  ],
}

const FEATURE = args && (args.feature || args)
if (!FEATURE || typeof FEATURE !== 'string') throw new Error('Pass args: { feature: "<roadmap item or spec section>" }')

const CONTEXT = `Repository: mixi-fan-hub (current directory), an unofficial Độ Mixi fan site. Next.js 16 with Cache Components, Supabase (RLS), Vercel.
Read docs/README.md for the doc map. Project skills live in .claude/skills/*/SKILL.md (db-change, fan-content, youtube-job, admin-page, ui-feature, done-check) — they are the house rules.
If the feature refers to COMPONENTS.md (the v2 "Tộc Đêm" design spec), look for it in the repo; if absent, say so and plan only what does not need its assets.
Feature to plan: ${FEATURE}`

const AREAS = [
  {
    key: 'data',
    prompt:
      'Map the DATA side: which tables/policies/functions in supabase/migrations exist that this feature reuses or must add; the row → map → data.ts path it will follow; what scripts/check-sql.mjs assertions it needs. Cite file:line.',
  },
  {
    key: 'ui',
    prompt:
      'Map the UI side: which pages/components exist that this feature extends or copies (cite the closest reference implementation), server/client split, Suspense needs, mock-mode behaviour, admin pages needed. Cite file:line.',
  },
  {
    key: 'jobs',
    prompt:
      'Map JOBS and INTEGRATIONS: does the feature need YouTube/Steam calls, cron, notifications, storage? Estimate quota per day. If it needs none, say so in one line. Cite file:line.',
  },
]

phase('Scout')
const maps = await parallel(
  AREAS.map((a) => () => agent(`${CONTEXT}\n\n${a.prompt}\nReturn a concise report (≤ 300 words). Read-only.`, { label: `scout:${a.key}`, phase: 'Scout' })),
)
const scouting = AREAS.map((a, i) => `## ${a.key}\n${maps[i] || '(scout failed — treat as unknown)'}`).join('\n\n')

const PLAN_SHAPE = `Write the plan as markdown with these sections:
1. Scope (in / out), and which roadmap checkbox(es) it ticks.
2. Skill(s) to follow from .claude/skills.
3. Ordered steps, each naming exact files to add or change.
4. Data: migration SQL outline (tables, constraints, RLS, column grants, triggers).
5. Tests: unit, db:check assertions, smoke additions.
6. Risks and the reviewer subagents to run.
7. Open questions for the user (only ones that would make the work wrong, each with a proposed default).`

phase('Draft')
const drafts = await parallel(
  [
    { key: 'minimal', angle: 'Plan the SMALLEST version that is shippable and safe: reuse existing tables/components, defer nice-to-haves to new roadmap items.' },
    { key: 'robust', angle: 'Plan the version that will not need rework in 3 months: proper moderation, limits, mock mode, admin tooling, tests, docs.' },
  ].map((d) => () =>
    agent(`${CONTEXT}\n\nScouting reports:\n${scouting}\n\n${d.angle}\n\n${PLAN_SHAPE}`, { label: `draft:${d.key}`, phase: 'Draft' }).then((plan) => ({ key: d.key, plan })),
  ),
)

phase('Judge')
const usable = drafts.filter((d) => d && d.plan)
if (!usable.length) throw new Error('Both drafts failed')
const final = await agent(
  `${CONTEXT}

Two independent plans follow. Score each 1–5 on: follows the house skills; security (RLS/grants/admin checks); quota and cost; testability (db:check, smoke, unit); size (smaller wins when equal). Then write ONE final plan: start from the higher-scoring plan and graft the better ideas from the other. Keep the same section structure. End with a 3-line scorecard.

${usable.map((d) => `### Plan "${d.key}"\n${d.plan}`).join('\n\n')}`,
  { label: 'judge', phase: 'Judge' },
)

return { feature: FEATURE, plan: final }
