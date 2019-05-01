// @ts-check
require('../helper')
const expect = require('expect')
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const { JSDOM } = require('jsdom')
const fakePromise = require('faked-promise')

const tick = () => new Promise(resolve => process.nextTick(resolve))

/**
 * @param {Partial<import('../../src/router').RouterOptions> & { routes: import('../../src/types').RouteRecord[]}} options
 */
function createRouter(options) {
  return new Router({
    history: new HTML5History(),
    ...options,
  })
}

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

const beforeEnter = jest.fn()
/** @type {import('../../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:n',
    component: Foo,
    beforeEnter,
  },
]

describe('beforeEnter', () => {
  beforeAll(() => {
    // TODO: move to utils for tests that need DOM
    const dom = new JSDOM(
      `<!DOCTYPE html><html><head></head><body></body></html>`,
      {
        url: 'https://example.org/',
        referrer: 'https://example.com/',
        contentType: 'text/html',
      }
    )

    // @ts-ignore
    global.window = dom.window
  })

  it('calls beforeEnter guards on push', async () => {
    const router = createRouter({ routes })
    beforeEnter.mockImplementationOnce((to, from, next) => {
      if (to.params.n !== 'valid') return next(false)
      next()
    })
    await router.push('/guard/valid')
    expect(beforeEnter).toHaveBeenCalledTimes(1)
  })

  it.skip('calls beforeEnter guards on replace', () => {})
  it.skip('does not call beforeEnter guard if we were already on the page', () => {})

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise()
    const router = createRouter({ routes })
    beforeEnter.mockImplementationOnce(async (to, from, next) => {
      await promise
      next()
    })
    const p = router.push('/foo')
    expect(router.currentRoute.fullPath).toBe('/')
    resolve()
    await p
    expect(router.currentRoute.fullPath).toBe('/foo')
  })
})
