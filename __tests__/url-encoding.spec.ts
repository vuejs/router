import { createRouter } from '../src/router'
import { createDom, components } from './utils'
import { RouteRecord } from '../src/types'
import { createMemoryHistory } from '../src'

const routes: RouteRecord[] = [
  { path: '/', name: 'home', component: components.Home },
  { path: '/%25', name: 'percent', component: components.Home },
  { path: '/to-p/:p', redirect: to => `/p/${to.params.p}` },
  { path: '/p/:p', component: components.Bar, name: 'params' },
]

// this function is meant to easy refactor in the future as Histories are going to be
// function-based
function createHistory() {
  const routerHistory = createMemoryHistory()
  return routerHistory
}

// TODO: add encoding
describe.skip('URL Encoding', () => {
  beforeAll(() => {
    createDom()
  })

  describe('initial navigation', () => {
    it('decodes path', async () => {
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.replace('/%25')
      const { currentRoute } = router
      expect(currentRoute.fullPath).toBe('/%25')
      expect(currentRoute.path).toBe('/%25')
    })

    it('decodes params in path', async () => {
      // /p/€
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/p/%E2%82%AC')
      const { currentRoute } = router
      expect(currentRoute.fullPath).toBe(encodeURI('/p/€'))
      expect(currentRoute.path).toBe(encodeURI('/p/€'))
      expect(currentRoute.params).toEqual({ p: '€' })
    })

    it('allows navigating to valid unencoded params (IE and Edge)', async () => {
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/p/€')
      const { currentRoute } = router
      expect(currentRoute.name).toBe('params')
      // unfortunately, we cannot encode the path as we cannot know if it already encoded
      // so comparing fullPath and path here is pointless
      // fullPath: '/p/€',
      // only the params matter
      expect(currentRoute.params).toEqual({ p: '€' })
    })

    it('allows navigating to invalid unencoded params (IE and Edge)', async () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/p/%notvalid')
      expect(spy).toHaveBeenCalledTimes(1)
      spy.mockRestore()
      const { currentRoute } = router
      expect(currentRoute.name).toBe('params')
      expect(currentRoute.params).toEqual({ p: '%notvalid' })
    })

    it('decodes params in query', async () => {
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/?q=%25%E2%82%AC')
      expect(router.currentRoute).toEqual(
        expect.objectContaining({
          name: 'home',
          fullPath: '/?q=' + encodeURIComponent('%€'),
          query: {
            q: '%€',
          },
          path: '/',
        })
      )
      const { currentRoute } = router
      expect(currentRoute.name).toBe('home')
      expect(currentRoute.path).toBe('/')
      expect(currentRoute.fullPath).toBe('/?q=' + encodeURIComponent('%€'))
      expect(currentRoute.query).toEqual({ q: '%€' })
    })

    it('decodes params keys in query', async () => {
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/?%E2%82%AC=euro')
      const { currentRoute } = router
      expect(currentRoute.name).toBe('home')
      expect(currentRoute.path).toBe('/')
      expect(currentRoute.fullPath).toBe(
        '/?' + encodeURIComponent('€') + '=euro'
      )
      expect(currentRoute.query).toEqual({
        query: {
          '€': 'euro',
        },
      })
    })

    it('allow unencoded params in query (IE Edge)', async () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/?q=€%notvalid')
      expect(spy).toHaveBeenCalledTimes(1)
      spy.mockRestore()
      const { currentRoute } = router
      expect(currentRoute.name).toBe('home')
      expect(currentRoute.path).toBe('/')
      expect(currentRoute.fullPath).toBe(
        '/?q=' + encodeURIComponent('€%notvalid')
      )
      expect(currentRoute.query).toEqual({
        query: {
          q: '€%notvalid',
        },
      })
    })

    // TODO: we don't do this in current version of vue-router
    // should we do it? it seems to be a bit different as it allows using % without
    // encoding it. To be safe we would have to encode everything
    it.skip('decodes hash', async () => {
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/#%25%E2%82%AC')
      const { currentRoute } = router
      expect(currentRoute.name).toBe('home')
      expect(currentRoute.path).toBe('/')
      expect(currentRoute.fullPath).toBe('/#' + encodeURIComponent('%€'))
      expect(currentRoute.hash).toBe('#%€')
    })

    it('allow unencoded params in query (IE Edge)', async () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push('/?q=€%notvalid')
      expect(spy).toHaveBeenCalledTimes(1)
      spy.mockRestore()
      const { currentRoute } = router
      expect(currentRoute.name).toBe('home')
      expect(currentRoute.path).toBe('/')
      expect(currentRoute.fullPath).toBe(
        '/?q=' + encodeURIComponent('€%notvalid')
      )
      expect(currentRoute.query).toEqual({
        q: '€%notvalid',
      })
    })
  })

  describe('resolving locations', () => {
    it('encodes params when resolving', async () => {
      const history = createHistory()
      const router = createRouter({ history, routes })
      await router.push({ name: 'params', params: { p: '%€' } })
      const { currentRoute } = router
      expect(currentRoute.path).toBe(encodeURI('/p/%€'))
      expect(currentRoute.fullPath).toBe(encodeURI('/p/%€'))
      expect(currentRoute.query).toEqual({
        p: '%€',
      })
    })
  })
})
