import {
  describe,
  expect,
  it,
  vi,
  beforeAll,
  type Mock,
  afterAll,
} from 'vitest'
import {
  HandlerContext,
  RoutesFolderWatcher,
  resolveFolderOptions,
} from './RoutesFolderWatcher'
import { resolveOptions, RoutesFolderOption } from '../options'
import pathe from 'pathe'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { type FSWatcher } from 'chokidar'

const FIXTURES_ROOT = pathe.resolve(
  pathe.join(tmpdir(), 'vue-router-' + Date.now())
)

const TEST_TIMEOUT = 4000

describe('RoutesFolderWatcher', () => {
  beforeAll(async () => {
    await fs.mkdir(FIXTURES_ROOT, { recursive: true })
  })

  // keep track of all watchers to close them after the tests
  let watcherList: RoutesFolderWatcher[] = []
  let testId = 0
  async function createWatcher(routesFolderOptions: RoutesFolderOption) {
    const rootDir = pathe.join(FIXTURES_ROOT, `test-${testId++}`)
    const srcDir = pathe.join(rootDir, routesFolderOptions.src)
    const options = resolveFolderOptions(
      resolveOptions({ root: rootDir, watch: false }),
      routesFolderOptions
    )

    await fs.mkdir(srcDir, { recursive: true })

    const watcher = new RoutesFolderWatcher(options)
    await waitForWatcher(watcher.watcher)
    watcherList.push(watcher)

    return { watcher, options, rootDir, srcDir }
  }

  afterAll(async () => {
    await Promise.all(watcherList.map(watcher => watcher.close()))
    watcherList = []
  })

  function waitForSpy(...spies: Mock[]) {
    if (spies.length < 1) {
      throw new Error('No spies provided')
    }

    return new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (spies.every(spy => spy.mock.calls.length > 0)) {
          clearInterval(checkInterval)
          clearTimeout(checkTimeout)
          resolve()
        }
      }, 20)
      const checkTimeout = setTimeout(() => {
        clearInterval(checkInterval)
        clearTimeout(checkTimeout)
        reject(new Error('Spy was not called'))
      }, TEST_TIMEOUT)
    })
  }

  function waitForWatcher(watcher: FSWatcher) {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('timeout'))
      }, TEST_TIMEOUT)
      watcher.on('error', (...args) => {
        clearTimeout(timeout)
        reject(...args)
      })
      watcher.on('ready', (...args) => {
        clearTimeout(timeout)
        resolve(...args)
      })
    })
  }

  it('triggers when new pages are added', async () => {
    const { watcher, srcDir } = await createWatcher({ src: 'src/pages' })

    const add = vi.fn<(ctx: HandlerContext) => void>()
    // chokidar triggers change and/or add ???
    watcher.on('add', add)
    watcher.on('change', add)

    expect(add).toHaveBeenCalledTimes(0)

    await fs.writeFile(pathe.join(srcDir, 'a.vue'), '', 'utf-8')

    await waitForSpy(add)
  })
})
