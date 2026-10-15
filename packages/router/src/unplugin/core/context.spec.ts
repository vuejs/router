import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'pathe'
import { createRoutesContext } from './context'
import { resolveOptions } from '../options'
import type { Options, RoutesFolderOptionResolved } from '../options'
import type * as RoutesFolderWatcherModule from './RoutesFolderWatcher'
import type { HandlerContext } from './RoutesFolderWatcher'
import { asRoutePath } from './utils'

type WatcherEvent = 'add' | 'change' | 'unlink'

const { watchers } = vi.hoisted(() => ({
  watchers: [] as Array<{
    folder: RoutesFolderOptionResolved
    handlers: Map<string, (ctx: HandlerContext) => unknown>
  }>,
}))

// emits the events manually instead of waiting for the file system
vi.mock('./RoutesFolderWatcher', async importOriginal => ({
  ...(await importOriginal<typeof RoutesFolderWatcherModule>()),
  RoutesFolderWatcher: class {
    src: string
    handlers = new Map<string, (ctx: HandlerContext) => unknown>()
    constructor(public folder: RoutesFolderOptionResolved) {
      this.src = folder.src
      watchers.push(this)
    }
    on(event: string, handler: (ctx: HandlerContext) => unknown) {
      this.handlers.set(event, handler)
      return this
    }
    close() {}
  },
}))

function page(definePageArg = '{ props: true }') {
  return `<script setup lang="ts">
defineProps()
definePage(${definePageArg})
</script>
`
}

// the resulting props are tested in e2e/unplugin/hmr
describe('createRoutesContext', () => {
  describe('pages with `definePage({ props: true })`', () => {
    let root: string
    let pagesDir: string
    let invalidated: string[]
    let ctx: ReturnType<typeof createRoutesContext>

    beforeEach(async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      root = await realpath(await mkdtemp(join(tmpdir(), 'vue-router-ctx-')))
      pagesDir = join(root, 'src/pages')
      invalidated = []
      watchers.length = 0
    })

    afterEach(async () => {
      ctx?.stopWatcher()
      vi.useRealTimers()
      await rm(root, { recursive: true, force: true })
    })

    async function writePage(file: string, content: string) {
      const filePath = join(pagesDir, file)
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, content)
      return filePath
    }

    async function setup(pages: Record<string, string>, options: Options = {}) {
      for (const [file, content] of Object.entries(pages)) {
        await writePage(file, content)
      }
      ctx = createRoutesContext(
        resolveOptions({
          root,
          dts: false,
          logs: false,
          watch: true,
          ...options,
        })
      )
      ctx.setServerContext({
        invalidate: () => false,
        invalidatePage: filePath => {
          invalidated.push(filePath)
          return false
        },
        updateRoutes: async () => {},
        reload: () => {},
      })
      await ctx.scanPages()
    }

    /**
     * Emits a watcher event and returns the pages it invalidated.
     */
    async function emit(event: WatcherEvent, filePath: string) {
      invalidated = []
      const watcher = watchers[0]!
      await watcher.handlers.get(event)!({
        filePath,
        routePath: asRoutePath(watcher.folder, filePath),
      })
      // let the throttled write of the config files run
      await vi.runAllTimersAsync()
      return invalidated
    }

    /**
     * Transforms the page like Vite does when it loads it.
     */
    async function loadPage(file: string) {
      const filePath = join(pagesDir, file)
      await ctx.definePageTransform(await readFile(filePath, 'utf8'), filePath)
      return filePath
    }

    it('reloads a parent page when a child page adds a param', async () => {
      await setup({ 'users.vue': page(), 'users/index.vue': page('{}') })
      const parent = await loadPage('users.vue')

      const child = await writePage('users/[id].vue', page('{}'))
      expect(await emit('add', child)).toContain(parent)
    })

    it('reloads a parent page when a child page with a param is removed', async () => {
      await setup({ 'users.vue': page(), 'users/[id].vue': page('{}') })
      const parent = await loadPage('users.vue')

      const child = join(pagesDir, 'users/[id].vue')
      await rm(child)
      expect(await emit('unlink', child)).toContain(parent)
    })

    it('reloads a child page when its parent changes its path params', async () => {
      await setup({ 'users.vue': page('{}'), 'users/[id].vue': page() })
      const child = await loadPage('users/[id].vue')

      const parent = await writePage(
        'users.vue',
        page(`{ path: '/teams/:team' }`)
      )
      expect(await emit('change', parent)).toContain(child)
    })

    it('reloads a child page when its parent adds query params', async () => {
      await setup({ 'users.vue': page('{}'), 'users/[id].vue': page() })
      const child = await loadPage('users/[id].vue')

      const parent = await writePage(
        'users.vue',
        page(`{ params: { query: { sort: {} } } }`)
      )
      expect(await emit('change', parent)).toContain(child)
    })

    it('does not reload pages whose props did not change', async () => {
      await setup({ 'users.vue': page(), 'users/[id].vue': page() })
      const parent = await loadPage('users.vue')
      const child = await loadPage('users/[id].vue')

      const grandChild = await writePage('users/[id]/edit.vue', page('{}'))
      const reloaded = await emit('add', grandChild)
      expect(reloaded).not.toContain(parent)
      expect(reloaded).not.toContain(child)
    })

    it('does not reload pages that no longer use `props: true`', async () => {
      await setup({ 'users.vue': page(), 'users/index.vue': page('{}') })
      const parent = await loadPage('users.vue')
      await writePage('users.vue', page('{}'))
      await loadPage('users.vue')

      const child = await writePage('users/[id].vue', page('{}'))
      expect(await emit('add', child)).not.toContain(parent)
    })

    it('reloads pages without `definePage()` with `propsDefault`', async () => {
      await setup(
        {
          'users.vue': `<script setup lang="ts">\ndefineProps()\n</script>\n`,
          'users/index.vue': page('{}'),
        },
        { experimental: { propsDefault: true } }
      )
      const parent = await loadPage('users.vue')

      const child = await writePage('users/[id].vue', page('{}'))
      expect(await emit('add', child)).toContain(parent)
    })
  })
})
