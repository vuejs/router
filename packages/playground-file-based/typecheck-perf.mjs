import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

const cwd = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('.', import.meta.url))
const output = join(cwd, 'node_modules/.cache/typecheck-perf')
mkdirSync(output, { recursive: true })
const cli = fileURLToPath(import.meta.resolve('vue-tsc/bin/vue-tsc.js'))
const median = values =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const results = {}

const projects = process.argv[3]
  ? JSON.parse(process.argv[3])
  : { app: 'tsconfig.app.json', node: 'tsconfig.node.json' }
for (const [project, config] of Object.entries(projects)) {
  const measurementConfig = join(output, `${project}.config.json`)
  writeFileSync(
    measurementConfig,
    JSON.stringify(
      {
        extends: resolve(cwd, config),
        references: [],
        compilerOptions: { composite: false },
      },
      null,
      2
    ) + '\n'
  )
  const args = [
    '--noEmit',
    '-p',
    measurementConfig,
    '--incremental',
    'false',
    '--extendedDiagnostics',
  ]
  const runs = []
  for (let i = 0; i < 5; i++) {
    const start = performance.now()
    const run = spawnSync(process.execPath, [cli, ...args], {
      cwd,
      encoding: 'utf8',
    })
    if (run.error) throw run.error
    const wallMs = performance.now() - start
    const log = run.stdout + run.stderr
    writeFileSync(join(output, `${project}-${i + 1}.log`), log)
    const metrics = Object.fromEntries(
      [...log.matchAll(/^([\w /]+?):\s+([\d.]+)(s|K)?\s*$/gm)].map(match => [
        match[1],
        Number(match[2]),
      ])
    )
    if (!('Check time' in metrics))
      throw new Error(`No check timing for ${project}: ${log}`)
    runs.push({ wallMs, exitCode: run.status, metrics })
  }
  const traceDir = join(output, `${project}-trace`)
  const trace = spawnSync(
    process.execPath,
    [cli, ...args, '--generateTrace', traceDir],
    { cwd, encoding: 'utf8' }
  )
  if (trace.error) throw trace.error
  writeFileSync(
    join(output, `${project}-trace.log`),
    trace.stdout + trace.stderr
  )
  const events = JSON.parse(readFileSync(join(traceDir, 'trace.json'), 'utf8'))
  const stacks = new Map()
  const durations = []
  for (const event of events) {
    const key = `${event.pid}:${event.tid}`
    if (!stacks.has(key)) stacks.set(key, [])
    const stack = stacks.get(key)
    if (event.ph === 'B') stack.push(event)
    if (event.ph === 'E') {
      const start = stack.pop()
      if (start) durations.push({ ...start, dur: event.ts - start.ts })
    }
    if (event.ph === 'X') durations.push(event)
  }
  const types = new Map(
    JSON.parse(readFileSync(join(traceDir, 'types.json'), 'utf8')).map(type => [
      type.id,
      type,
    ])
  )
  results[project] = {
    runs,
    medianWallMs: median(runs.map(run => run.wallMs)),
    medianMetrics: Object.fromEntries(
      Object.keys(runs[0].metrics).map(key => [
        key,
        median(runs.map(run => run.metrics[key])),
      ])
    ),
    files: durations
      .filter(event => event.name === 'checkSourceFile')
      .sort((a, b) => b.dur - a.dur)
      .slice(0, 15)
      .map(event => ({ path: event.args.path, ms: event.dur / 1000 })),
    typeRelations: durations
      .filter(event => event.cat === 'checkTypes')
      .sort((a, b) => b.dur - a.dur)
      .slice(0, 10)
      .map(event => ({
        name: event.name,
        ms: event.dur / 1000,
        types: Object.fromEntries(
          Object.entries(event.args ?? {})
            .filter(([key]) => ['sourceId', 'targetId', 'id'].includes(key))
            .map(([key, id]) => [key, types.get(id)])
        ),
      })),
  }
  console.log(
    `${project}: median wall ${results[project].medianWallMs.toFixed(0)} ms; check ${results[project].medianMetrics['Check time']} s; exit ${runs[0].exitCode}`
  )
}

writeFileSync(
  join(output, 'summary.json'),
  JSON.stringify({ node: process.version, results }, null, 2) + '\n'
)
console.log(`Logs, traces, and summary: ${output}`)
