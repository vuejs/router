import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { build } from 'vite'
import { watch } from 'chokidar'
import type * as Chokidar from 'chokidar'
import VueRouter from './vite'

vi.mock('chokidar', async importOriginal => {
  const chokidar = await importOriginal<typeof Chokidar>()
  return { ...chokidar, watch: vi.fn(chokidar.watch) }
})

describe('vite plugin', () => {
  let root: string

  beforeEach(async () => {
    vi.mocked(watch).mockClear()
    root = await realpath(await mkdtemp(join(tmpdir(), 'vue-router-vite-')))
    await mkdir(join(root, 'src/pages'), { recursive: true })
    await mkdir(join(root, 'src/params'), { recursive: true })
    await writeFile(join(root, 'src/pages/index.js'), 'export default {}\n')
    await writeFile(
      join(root, 'src/main.js'),
      `import { routes } from 'vue-router/auto-routes'\nconsole.log(routes)\n`
    )
    await writeFile(
      join(root, 'index.html'),
      '<script type="module" src="/src/main.js"></script>\n'
    )
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('does not watch files during a build', async () => {
    await build({
      root,
      configFile: false,
      logLevel: 'silent',
      build: { write: false },
      plugins: [
        VueRouter({
          root,
          extensions: ['.js'],
          dts: false,
          watch: true,
          experimental: { paramParsers: true },
        }),
      ],
    })

    expect(watch).not.toHaveBeenCalled()
  })
})
