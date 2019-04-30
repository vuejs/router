// @ts-check
require('./helper')
const expect = require('expect')
const { HTML5History } = require('../src/history/html5')
const { Router } = require('../src/router')
const { JSDOM } = require('jsdom')
const fakePromise = require('faked-promise')

const tick = () => new Promise(resolve => process.nextTick(resolve))

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

describe('router.afterEach', () => {
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

  it('calls afterEach guards on push', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    router.afterEach(spy)
    await router.push('/foo')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ fullPath: '/foo' }),
      expect.objectContaining({ fullPath: '/' })
    )
  })

  it.skip('calls afterEach guards on replace', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    router.afterEach(spy)
    // await router.replace('/foo')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
