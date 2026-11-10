export const meta = {
  name: 'release-check',
  description: 'Release readiness for mixi-fan-hub: run every gate, review the release diff, and check production setup steps — never deploys',
  whenToUse: 'Before promoting to production or merging developer into main. args: { base?: "main" }',
  phases: [
    { title: 'Gates', detail: 'lint, typecheck, test, db:check, smoke, build' },
    { title: 'Review', detail: 'review-changes over base...HEAD' },
    { title: 'Readiness', detail: 'env keys, migrations, cron, auth providers, docs drift' },
  ],
}

const BASE = (args && args.base) || 'main'

const GATES = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          passed: { type: 'boolean' },
          evidence: { type: 'string', description: 'the summary line(s) from the output, e.g. "Tests 60 passed", "DB_CHECK=pass", or the first error' },
        },
        required: ['command', 'passed'],
      },
    },
  },
  required: ['results'],
}

phase('Gates')
const gates = await agent(
  `In the mixi-fan-hub repository (current directory), run each command below in order, fully, and report each result with evidence from its output. Do not fix anything; do not skip a command because an earlier one failed.
npm run lint
npm run typecheck
npm test
npm run db:check
npm run smoke
npm run build`,
  { model: 'opus', label: 'gates', phase: 'Gates', schema: GATES },
)
const gateFails = gates ? gates.results.filter((r) => !r.passed) : [{ command: 'all', evidence: 'gate agent failed' }]

phase('Review')
let review = null
try {
  review = await workflow('review-changes', { diff: `git diff ${BASE}...HEAD`, intent: `release of everything on this branch since ${BASE}` })
} catch (e) {
  log(`review-changes could not run: ${e.message}`)
}

phase('Readiness')
const readiness = await agent(
  `Release readiness check for mixi-fan-hub (current directory), comparing HEAD with ${BASE}. Read-only; never deploy, push or print secret values.
Check and report each as OK / ACTION NEEDED / UNKNOWN, with the reason:
1. Every env key used in src/ (grep process.env) is listed in .env.example and in the table in docs/06-setup.md. To see which keys a local env file defines, list key NAMES only (never values), e.g. with: cut -d= -f1 <file>.
2. Migrations: list files in supabase/migrations changed since ${BASE}. A changed file that already existed in ${BASE} = ACTION NEEDED (applied migrations must not be edited; add a new one).
3. supabase/cron.sql changed since ${BASE}? Then it must be re-run by hand in production — list the statements.
4. Auth: supabase/config.toml has [auth.email] enable_signup = false; docs/06-setup.md tells the operator to disable the Email provider in production.
5. docs/05-roadmap.md reflects what this release contains (no shipped item still unchecked, no unchecked item claimed done).
6. Fan-site rules: footer disclaimer and /gioi-thieu still present.
7. The manual production steps the human must do after merging (from docs/06-setup.md), in order.`,
  { model: 'opus', label: 'readiness', phase: 'Readiness' },
)

const blocking = review && review.confirmed ? review.confirmed.length : 0
const verdict = gateFails.length || blocking ? 'NOT READY' : 'READY (pending the manual steps listed under readiness)'
return { verdict, gateFails, gates: gates && gates.results, review, readiness }
