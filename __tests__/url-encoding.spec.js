// @ts-check
require('./helper')
const expect = require('expect')
const { Router } = require('../src/router')
const { createDom, components, tick, HistoryMock } = require('./utils')

/** @type {import('../src/types').RouteRecord[]} */
const routes = [
  { path: '/%25', name: 'home', component: components.Home },
  { path: '/to-p/:p', redirect: to => `/p/${to.params.p}` },
  { path: '/p/:p', component: components.Bar },
]

function createHistory(initialUrl) {
  return new HistoryMock(initialUrl)
}

describe('URL Encoding', () => {
  beforeAll(() => {
    createDom()
  })

  describe('initial navigation', () => {
    it('decodes path', async () => {
      const history = createHistory('/%25')
      const router = new Router({ history, routes })
      await router.doInitialNavigation()
      expect(router.currentRoute).toEqual(
        expect.objectContaining({
          name: 'home',
          fullPath: '/%25',
          path: '/%25',
        })
      )
    })

    it('decodes params in path', async () => {
      // /p/€
      const history = createHistory('/p/%E2%82%AC')
      const router = new Router({ history, routes })
      await router.doInitialNavigation()
      expect(router.currentRoute).toEqual(
        expect.objectContaining({
          name: undefined,
          fullPath: encodeURI('/p/€'),
          params: { p: '€' },
          path: encodeURI('/p/€'),
        })
      )
    })
  })
})
