export const meta = {
  name: 'review-changes',
  description: 'Review a diff with the four project reviewers plus a correctness pass, then try to refute every high/critical finding',
  whenToUse: 'Before committing or opening a PR on mixi-fan-hub, especially for auth, RLS, server actions, cron jobs or UI text/links. args: { diff?: "git diff command", intent?: "what the change is for" }',
  phases: [
    { title: 'Review', detail: 'rls-auditor, next16-reviewer, fan-site-guard, quota-auditor, correctness — in parallel' },
    { title: 'Verify', detail: '3 independent refuters per high/critical finding, majority wins' },
  ],
}

const DIFF = (args && args.diff) || 'git diff developer...HEAD; git diff HEAD; git status --short'
const INTENT = (args && args.intent) || 'not stated — infer it from the diff and docs/05-roadmap.md'

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          where: { type: 'string', description: 'file:line' },
          claim: { type: 'string', description: 'one sentence, then the concrete scenario and the fix' },
        },
        required: ['severity', 'where', 'claim'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    why: { type: 'string' },
  },
  required: ['refuted'],
}

const brief = (focus) => `Review this change to the mixi-fan-hub repository (current working directory).
Get the change with: ${DIFF}
(Include untracked files from git status by reading them.)
Intent: ${INTENT}
${focus}
Report only findings you can tie to a specific file:line. Empty list if none.`

const REVIEWERS = [
  { key: 'authz', agentType: 'rls-auditor', focus: 'Your dimension: authorization (RLS, grants, admin checks, service-role use).' },
  { key: 'next16', agentType: 'next16-reviewer', focus: 'Your dimension: Next.js 16 correctness (caching, Suspense boundaries, route exports, server/client).' },
  { key: 'policy', agentType: 'fan-site-guard', focus: 'Your dimension: fan-site rules (branding, links, money, fan content, privacy, UX rules).' },
  { key: 'quota', agentType: 'quota-auditor', focus: 'Your dimension: external API cost and job safety.' },
  {
    key: 'correctness',
    focus:
      'Your dimension: logic bugs only — wrong conditions, off-by-one, time-zone errors (schedule is Vietnam time UTC+7, storage is UTC), null handling, race conditions, mock-mode vs Supabase-mode divergence, missing tests for new pure logic. Run `npm test` if useful.',
  },
]

phase('Review')
const reviews = await parallel(
  REVIEWERS.map((r) => () =>
    agent(brief(r.focus), { label: `review:${r.key}`, phase: 'Review', schema: FINDINGS, ...(r.agentType ? { agentType: r.agentType } : {}) })
      .then((res) => (res ? res.findings.map((f) => ({ ...f, dimension: r.key })) : null)),
  ),
)
const failed = REVIEWERS.filter((_, i) => reviews[i] === null).map((r) => r.key)
if (failed.length) log(`Reviewers that returned nothing (not covered): ${failed.join(', ')}`)

// Barrier is deliberate: dedup across dimensions before spending refuters.
const seen = new Map()
for (const f of reviews.filter(Boolean).flat()) {
  const key = `${f.where.split(':')[0]}|${f.claim.slice(0, 60).toLowerCase()}`
  if (!seen.has(key)) seen.set(key, f)
}
const all = [...seen.values()]
const blocking = all.filter((f) => f.severity === 'critical' || f.severity === 'high')
const minor = all.filter((f) => f.severity === 'medium' || f.severity === 'low')
log(`${all.length} findings (${blocking.length} high/critical to verify, ${minor.length} medium/low reported as-is)`)

phase('Verify')
const verified = await parallel(
  blocking.map((f, i) => () =>
    parallel(
      [0, 1, 2].map((n) => () =>
        agent(
          `Try to REFUTE this code-review finding about the mixi-fan-hub repository (current directory). Read the code yourself; you are not given the reviewer's reasoning.
Finding (${f.severity}) at ${f.where}: ${f.claim}
The change under review: ${DIFF}
Refuted = the claim is false, cannot happen in this code, or is already prevented elsewhere (check RLS in supabase/migrations, requireAdmin, cronRoute, mappers). If you cannot decide, answer refuted=true. Refuter #${n + 1}.`,
          { label: `refute:${i + 1}.${n + 1}`, phase: 'Verify', schema: VERDICT },
        ),
      ),
    ).then((votes) => {
      const valid = votes.filter(Boolean)
      const stands = valid.filter((v) => !v.refuted).length
      return { ...f, votes: `${stands}/${valid.length} stand`, confirmed: stands >= 2 }
    }),
  ),
)

const confirmed = verified.filter((f) => f && f.confirmed)
const refuted = verified.filter((f) => f && !f.confirmed)
return {
  verdict: confirmed.length ? 'BLOCK: fix confirmed high/critical findings, re-run done-check and this workflow' : 'OK to commit (see minor findings)',
  confirmed,
  refuted: refuted.map((f) => ({ where: f.where, claim: f.claim, votes: f.votes })),
  minor,
  notCovered: failed,
}
