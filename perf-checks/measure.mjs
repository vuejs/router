import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { cpus, platform, arch } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const root = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const names = []
let runs = 3
let trace = false
let all = false

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--runs') runs = Number(args[++i])
  else if (arg === '--trace') trace = true
  else if (arg === '--all') all = true
  else if (arg === '--help') {
    console.log(
      'node perf-checks/measure.mjs [fixture ...] [--all] [--runs 3] [--trace]'
    )
    process.exit(0)
  } else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
  else names.push(arg)
}
if (!Number.isInteger(runs) || runs < 1)
  throw new Error('--runs must be a positive integer')
if (all) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'results') {
      try {
        await readFile(join(root, entry.name, 'package.json'))
        names.push(entry.name)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
  }
}
if (!names.length) names.push('classic')
const fixtures = [...new Set(names)]
if (all) {
  fixtures.sort((a, b) =>
    a === 'classic' ? -1 : b === 'classic' ? 1 : a.localeCompare(b)
  )
}
for (const name of fixtures) {
  if (!/^[a-z0-9-]+$/.test(name))
    throw new Error(`Invalid fixture name: ${name}`)
}

async function filesIn(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesIn(path)))
    else if (entry.isFile()) files.push(path)
  }
  return files.sort()
}

// props pages get the params from defineProps() instead of useRoute()
const propsPageChanges = [
  [
    "import { useRouter } from 'vue-router'\n",
    "import { useRoute, useRouter } from 'vue-router'\n",
  ],
  [
    'definePage({ props: true })\n\nconst { workspaceId, recordId } = defineProps()\nconst router = useRouter()\n',
    'const route = useRoute()\nconst router = useRouter()\nconst workspaceId = computed(() => String(route.params.workspaceId))\nconst recordId = computed(() => String(route.params.recordId))\n',
  ],
  [
    'params: { workspaceId, recordId: id },',
    'params: { workspaceId: workspaceId.value, recordId: id },',
  ],
]

async function validateCopies() {
  let original
  const validation = {}
  for (const name of fixtures) {
    const source = join(root, name, 'src')
    const pages = (await filesIn(join(source, 'pages'))).filter(path =>
      path.endsWith('.vue')
    )
    if (pages.length !== 50)
      throw new Error(
        `${name}: expected 50 page components, found ${pages.length}`
      )
    const shared = new Map()
    let propsPages = 0
    for (const path of await filesIn(source)) {
      const local = relative(source, path)
      if (local === 'router.ts' || local === 'routes.d.ts') continue
      let contents = await readFile(path)
      if (name === 'auto-resolver-props' && pages.includes(path)) {
        let text = contents.toString('utf8')
        for (const [props, params] of propsPageChanges) {
          const parts = text.split(props)
          if (parts.length !== 2) {
            throw new Error(
              `${name}: src/${local} must contain exactly once: ${props}`
            )
          }
          text = parts.join(params)
        }
        contents = Buffer.from(text)
        propsPages++
      }
      shared.set(local, contents)
    }
    if (original) {
      const paths = new Set([...original.files.keys(), ...shared.keys()])
      for (const path of paths) {
        const expected = original.files.get(path)
        if (!expected || !shared.get(path)?.equals(expected)) {
          throw new Error(
            `${name}: src/${path} differs from ${original.name}; keep benchmark application sources identical`
          )
        }
      }
    } else original = { name, files: shared }
    validation[name] = {
      pageCount: pages.length,
      sharedSourceFileCount: shared.size,
      comparedWith: name === original.name ? null : original.name,
      excludedSourceFiles: ['router.ts', 'routes.d.ts'],
      normalizedPropsPages: propsPages,
      allowedPageDifference: propsPages
        ? 'definePage({ props: true }) and params from defineProps()'
        : null,
    }
  }
  return validation
}

const median = values => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}
const rounded = value => Math.round(value * 100) / 100

function diagnostics(output) {
  const result = {}
  for (const line of output.split('\n')) {
    const match = line.match(/^([A-Za-z][A-Za-z /-]+):\s+([\d.]+)(s|K)?\s*$/)
    if (!match) continue
    const [, label, number, suffix] = match
    result[label.trim()] = {
      value:
        Number(number) * (suffix === 's' ? 1000 : suffix === 'K' ? 1024 : 1),
      unit: suffix === 's' ? 'ms' : suffix === 'K' ? 'bytes' : 'count',
    }
  }
  return result
}

function aggregate(samples) {
  const phases = {}
  for (const label of Object.keys(samples[0].diagnostics ?? {})) {
    phases[label] = {
      median: rounded(
        median(samples.map(sample => sample.diagnostics[label].value))
      ),
      unit: samples[0].diagnostics[label].unit,
    }
  }
  return {
    medianWallMs: rounded(median(samples.map(sample => sample.wallMs))),
    diagnostics: phases,
    samples,
  }
}

async function command(cwd, cli, cliArgs, logPath) {
  const start = process.hrtime.bigint()
  const child = spawn(process.execPath, [cli, ...cliArgs], {
    cwd,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', data => {
    output += data
  })
  child.stderr.on('data', data => {
    output += data
  })
  const status = await new Promise((resolveStatus, reject) => {
    child.on('error', reject)
    child.on('close', (code, signal) => resolveStatus({ code, signal }))
  })
  const wallMs = Number(process.hrtime.bigint() - start) / 1e6
  await writeFile(logPath, output)
  if (status.code !== 0) {
    throw new Error(
      `${relative(root, cwd)}: ${cliArgs.join(' ')} failed (${status.signal ?? status.code}). See ${logPath}\n${output.slice(-6000)}`
    )
  }
  return {
    wallMs: rounded(wallMs),
    exitCode: status.code,
    diagnostics: diagnostics(output),
  }
}

async function bundleSizes(directory) {
  const files = []
  for (const path of await filesIn(directory)) {
    const contents = await readFile(path)
    files.push({
      path: relative(directory, path),
      bytes: contents.length,
      gzipBytes: gzipSync(contents).length,
    })
  }
  const javascript = files.filter(file => /\.(?:m?js)$/.test(file.path))
  return {
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    javascriptBytes: javascript.reduce((total, file) => total + file.bytes, 0),
    javascriptGzipBytes: javascript.reduce(
      (total, file) => total + file.gzipBytes,
      0
    ),
    javascriptFiles: javascript.length,
    files,
  }
}

async function traceSummary(directory) {
  const [events, types] = await Promise.all(
    ['trace.json', 'types.json'].map(async name =>
      JSON.parse(await readFile(join(directory, name), 'utf8'))
    )
  )
  const typeById = new Map(types.map(type => [type.id, type]))
  const describeType = id => {
    const type = typeById.get(id)
    if (!type) return null
    return {
      name:
        type.symbolName ??
        type.display ??
        type.intrinsicName ??
        type.flags?.join(' | ') ??
        '(anonymous)',
      declaration: type.firstDeclaration ?? null,
    }
  }
  const sources = new Map()
  const relations = []
  const stacks = new Map()
  for (const event of events) {
    let span = event
    if (event.ph === 'B') {
      const thread = `${event.pid}:${event.tid}`
      if (!stacks.has(thread)) stacks.set(thread, [])
      stacks.get(thread).push(event)
      continue
    }
    if (event.ph === 'E') {
      const begin = stacks.get(`${event.pid}:${event.tid}`)?.pop()
      if (!begin) continue
      span = {
        ...begin,
        dur: event.ts - begin.ts,
        args: { ...begin.args, ...event.args },
      }
    } else if (event.ph !== 'X') continue
    if (typeof span.dur !== 'number') continue
    if (span.name === 'checkSourceFile') {
      const path = span.args?.path ?? '(unknown)'
      sources.set(path, (sources.get(path) ?? 0) + span.dur / 1000)
    }
    if (span.name === 'structuredTypeRelatedTo') {
      relations.push({
        durationMs: rounded(span.dur / 1000),
        ...span.args,
        sourceType: describeType(span.args?.sourceId),
        targetType: describeType(span.args?.targetId),
      })
    }
  }
  return {
    topSourceFiles: [...sources]
      .map(([path, durationMs]) => ({ path, durationMs: rounded(durationMs) }))
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 20),
    topTypeRelations: relations
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 20),
  }
}

const validation = await validateCopies()
const summary = {
  recordedAt: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: platform(),
    arch: arch(),
    cpu: cpus()[0]?.model,
  },
  runs,
  methodology:
    'Sequential fresh processes; one unmeasured Vite build first; no TypeScript incremental cache; warm OS caches; medians of measured runs. Bundle gzip sizes sum files compressed separately.',
  fixtures: {},
}
await mkdir(join(root, 'results'), { recursive: true })
for (const name of fixtures) {
  const cwd = join(root, name)
  const output = join(root, 'results', name)
  await mkdir(output, { recursive: true })
  const require = createRequire(join(cwd, 'package.json'))
  const bin = packageName => {
    const packagePath = require.resolve(`${packageName}/package.json`)
    const pkg = require(packagePath)
    const local = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[packageName]
    return resolve(dirname(packagePath), local)
  }
  const vueTsc = bin('vue-tsc')
  const vite = bin('vite')
  console.log(`${name}: prepare route declarations and build`)
  await command(cwd, vite, ['build'], join(output, 'prepare-build.log'))
  const result = {
    validation: validation[name],
    versions: Object.fromEntries(
      ['vue-tsc', 'typescript', 'vite', 'vue', 'vue-router'].map(pkg => [
        pkg,
        require(`${pkg}/package.json`).version,
      ])
    ),
  }
  for (const target of ['app', 'node']) {
    const samples = []
    for (let run = 1; run <= runs; run++) {
      console.log(`${name}: vue-tsc ${target}, run ${run}/${runs}`)
      samples.push(
        await command(
          cwd,
          vueTsc,
          [
            '--project',
            `tsconfig.${target}.json`,
            '--noEmit',
            '--incremental',
            'false',
            '--extendedDiagnostics',
          ],
          join(output, `types-${target}-${run}.log`)
        )
      )
    }
    result[`types${target === 'app' ? 'App' : 'Node'}`] = aggregate(samples)
  }
  const builds = []
  for (let run = 1; run <= runs; run++) {
    console.log(`${name}: Vite build, run ${run}/${runs}`)
    builds.push(
      await command(cwd, vite, ['build'], join(output, `build-${run}.log`))
    )
  }
  result.build = aggregate(builds)
  result.bundle = await bundleSizes(join(cwd, 'dist'))
  if (trace) {
    const traceDirectory = join(output, 'trace-app')
    await command(
      cwd,
      vueTsc,
      [
        '--project',
        'tsconfig.app.json',
        '--noEmit',
        '--incremental',
        'false',
        '--generateTrace',
        traceDirectory,
      ],
      join(output, 'trace-app.log')
    )
    result.trace = await traceSummary(traceDirectory)
    await writeFile(
      join(output, 'trace-summary.json'),
      JSON.stringify(result.trace, null, 2) + '\n'
    )
  }
  summary.fixtures[name] = result
  await writeFile(
    join(output, 'summary.json'),
    JSON.stringify({ ...summary, fixtures: { [name]: result } }, null, 2) + '\n'
  )
  await writeFile(
    join(root, 'results', 'summary.json'),
    JSON.stringify(summary, null, 2) + '\n'
  )
  console.log(
    `${name}: app ${result.typesApp.medianWallMs} ms; config ${result.typesNode.medianWallMs} ms; build ${result.build.medianWallMs} ms; JS ${result.bundle.javascriptBytes} bytes (${result.bundle.javascriptGzipBytes} gzip)`
  )
}
console.log(`Results: ${join(root, 'results', 'summary.json')}`)
