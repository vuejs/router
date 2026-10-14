import { existsSync, lstatSync, readdirSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const dependencies = join(
  root,
  '../packages/playground-file-based/node_modules'
)
if (!existsSync(dependencies)) {
  throw new Error('Install the repository dependencies with pnpm first.')
}
const require = createRequire(join(dependencies, '../package.json'))
for (const name of [
  'vue',
  'vue-router',
  'vue-tsc',
  'typescript',
  'vite',
  '@vitejs/plugin-vue',
  '@vue/tsconfig',
  '@types/node',
]) {
  require.resolve(`${name}/package.json`)
}
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (
    !entry.isDirectory() ||
    !existsSync(join(root, entry.name, 'package.json'))
  )
    continue
  const target = join(root, entry.name, 'node_modules')
  if (!existsSync(target))
    symlinkSync(relative(join(root, entry.name), dependencies), target, 'dir')
  else if (!lstatSync(target).isSymbolicLink())
    throw new Error(`Expected shared dependencies at ${target}`)
  console.log(`Dependencies ready: ${entry.name}`)
}
