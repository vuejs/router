// @ts-check
require('./helper')
const expect = require('expect')
const { HTML5History } = require('../src/history/html5')
const { Router } = require('../src/router')
const { JSDOM } = require('jsdom')
const fakePromise = require('faked-promise')

/**
 * @param {Partial<import('../src/router').RouterOptions> & { routes: import('../src/types').RouteRecord[]}} options
 */
function createRouter(options) {
  return new Router({
    history: new HTML5History(),
    ...options,
  })
}

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

/** @type {import('../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
]

describe('navigation guards', () => {
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

  it('calls beforeEach guards on push', () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    router.beforeEach(spy)
    router.push('/foo')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise()
    const router = createRouter({ routes })
    router.beforeEach(async (to, from, next) => {
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
