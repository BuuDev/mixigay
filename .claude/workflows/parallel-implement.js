export const meta = {
  name: 'parallel-implement',
  description: 'Build an approved plan as parallel slices (one implementer per disjoint file set, tests alongside), then run the gate once',
  whenToUse: 'After a plan is approved (e.g. from plan-feature) and it splits into 2–6 slices with disjoint files. args: { goal: "…", slices: [{ key, files: ["src/…"], pattern?: "file to copy", brief: "what to build + acceptance criteria", tests?: ["…test.ts"] }] }',
  phases: [
    { title: 'Build', detail: 'one implementer per slice (+ test-writer when the slice lists tests), all at once', model: 'opus' },
    { title: 'Gate', detail: 'lint · typecheck · test · build on the combined tree', model: 'opus' },
  ],
}

const MAX_SLICES = 6
const goal = args && args.goal
const slices = (args && args.slices) || []
if (!goal || !slices.length) throw new Error('args.goal and args.slices are required')
if (slices.length > MAX_SLICES) throw new Error(`at most ${MAX_SLICES} slices per run (got ${slices.length}); split the plan into waves`)

// Two agents editing one file in the same tree overwrite each other: refuse up front.
const owner = {}
for (const s of slices) {
  for (const f of [...s.files, ...(s.tests || [])]) {
    if (owner[f]) throw new Error(`file ${f} is in both "${owner[f]}" and "${s.key}"; give every file to exactly one slice`)
    owner[f] = s.key
  }
}

const REPORT = {
  type: 'object',
  properties: {
    report: { type: 'string', description: 'files changed, outside changes needed (file + exact change) or "none", own lint/typecheck result, anything not done' },
  },
  required: ['report'],
}

phase('Build')
const built = await parallel(
  slices.flatMap((s) => {
    const others = slices.filter((o) => o !== s).map((o) => `${o.key}: ${o.files.join(', ')}`).join('\n')
    const jobs = [
      () =>
        agent(
          `Overall goal: ${goal}\n\nYour slice "${s.key}":\n${s.brief}\n\nFiles you own (edit only these):\n${s.files.join('\n')}\n${s.pattern ? `\nPattern to copy: ${s.pattern}\n` : ''}\nOther slices are being built right now by other agents; do not touch their files:\n${others || '(none)'}`,
          { model: 'opus', label: `build:${s.key}`, phase: 'Build', agentType: 'implementer', schema: REPORT },
        ).then((r) => ({ key: s.key, role: 'build', report: r ? r.report : 'agent did not return' })),
    ]
    if (s.tests && s.tests.length) {
      jobs.push(() =>
        agent(
          `Acceptance criteria and interface for slice "${s.key}" (goal: ${goal}):\n${s.brief}\n\nModules under test: ${s.files.join(', ')}\nTest files you own: ${s.tests.join(', ')}`,
          { model: 'opus', label: `test:${s.key}`, phase: 'Build', agentType: 'test-writer', schema: REPORT },
        ).then((r) => ({ key: s.key, role: 'test', report: r ? r.report : 'agent did not return' })),
      )
    }
    return jobs
  }),
)

phase('Gate')
const gate = await agent(
  `All slices of "${goal}" have been written into the working tree. Run, in order, from the repo root: npm run lint, npm run typecheck, npm test, npm run build. Do not edit any file. For each command report pass/fail with counts, and for each failure the file:line and which slice owns that file. Slice ownership:\n${Object.entries(owner).map(([f, k]) => `${f} → ${k}`).join('\n')}`,
  { model: 'opus', label: 'gate', phase: 'Gate', schema: REPORT },
)

return { slices: built.filter(Boolean), gate: gate ? gate.report : 'gate agent did not return' }
