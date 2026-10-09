#!/usr/bin/env node
// Checks that every export of vue-router/experimental is listed in references/exports.md.
// Usage: node skills/migrate-v5-experimental-router/scripts/check-exports.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(skillDir, '../..')
const indexFile = resolve(repoRoot, 'packages/router/src/experimental/index.ts')
const exportsDoc = readFileSync(
  resolve(skillDir, 'references/exports.md'),
  'utf8'
)

const source = readFileSync(indexFile, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')

const names = new Set()
for (const [, list] of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
  for (const raw of list.split(',')) {
    const spec = raw.trim().replace(/^type\s+/, '')
    if (!spec) continue
    names.add(
      spec
        .split(/\s+as\s+/)
        .at(-1)
        .trim()
    )
  }
}
for (const [, name] of source.matchAll(
  /export\s+(?:declare\s+)?(?:class|function|const|let|interface|type)\s+(\w+)/g
)) {
  names.add(name)
}

// a name is covered if it appears as `Name` or inside a `Name*` wildcard
const wildcards = [...exportsDoc.matchAll(/`(\w+)\*`/g)].map(([, p]) => p)
const missing = [...names].filter(
  name =>
    !new RegExp('`' + name + '`').test(exportsDoc) &&
    !wildcards.some(prefix => name.startsWith(prefix))
)

if (missing.length) {
  console.error(
    `references/exports.md is missing ${missing.length} export(s) of vue-router/experimental:\n` +
      missing.map(n => `  - ${n}`).join('\n')
  )
  process.exit(1)
}
console.log(
  `OK: ${names.size} exports of vue-router/experimental are documented.`
)
