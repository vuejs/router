/**
 * @vitest-environment node
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const packageRoot = new URL('../', import.meta.url)
const distEntry = new URL('dist/vue-router.js', packageRoot)

/**
 * Runs a navigation in a child Node process so the package is loaded through
 * real Node resolution: no bundler replaces the `__VUE_*` feature flags and
 * vitest's `define`/aliases don't apply.
 */
function navigateInNode(entry: URL) {
  return execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createSSRApp, h } from 'vue'

const entry = ${JSON.stringify(entry.href)}
const { createRouter, createMemoryHistory } = entry.endsWith('.cjs')
  ? createRequire(import.meta.url)(fileURLToPath(entry))
  : await import(entry)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: {
        beforeRouteEnter() {
          console.log('guard ran')
        },
        render: () => h('div'),
      },
    },
  ],
})

createSSRApp({ render: () => h('div') }).use(router)
await router.push('/')
console.log('OK ' + router.currentRoute.value.fullPath)
`,
    ],
    {
      cwd: fileURLToPath(packageRoot),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )
}

// `dist/` is a build artifact, so these only run after `pnpm build` (which
// `pnpm test` and CI do before the unit tests).
describe.skipIf(!existsSync(fileURLToPath(distEntry)))(
  'built entries on plain Node',
  () => {
    it('navigates through the node ESM entry', () => {
      const out = navigateInNode(new URL('vue-router.node.mjs', packageRoot))
      expect(out).toContain('guard ran')
      expect(out).toContain('OK /')
    })

    it('navigates through the CJS entry', () => {
      const out = navigateInNode(new URL('index.cjs', packageRoot))
      expect(out).toContain('guard ran')
      expect(out).toContain('OK /')
    })
  }
)
