// @ts-check
require('../helper')
const expect = require('expect')
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const { NAVIGATION_TYPES, createDom } = require('../utils')

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

/** @type {import('../../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
]

describe('router.afterEach', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls afterEach guards on push', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        router.afterEach(spy)
        await router[navigationMethod]('/foo')
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({ fullPath: '/foo' }),
          expect.objectContaining({ fullPath: '/' })
        )
      })

      it('does not call afterEach if navigation is cancelled', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        router.afterEach(spy)
        router.beforeEach((to, from, next) => {
          next(false) // cancel the navigation
        })
        await router[navigationMethod]('/foo').catch(err => {}) // ignore the error
        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
