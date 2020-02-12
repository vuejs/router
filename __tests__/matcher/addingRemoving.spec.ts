import { createRouterMatcher } from '../../src/matcher'
import { MatcherLocationNormalized } from '../../src/types'

const currentLocation = { path: '/' } as MatcherLocationNormalized
// @ts-ignore
const component: RouteComponent = null

describe('normalizeRouteRecord', () => {
  it('can add records', () => {
    const matcher = createRouterMatcher([], {})
    matcher.addRoute({ path: '/', component, name: 'home' })
    expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
      name: 'home',
    })
  })

  describe('addRoute returned function', () => {
    it('remove records', () => {
      const matcher = createRouterMatcher([], {})
      const remove = matcher.addRoute({ path: '/', component, name: 'home' })
      remove()
      expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
        name: undefined,
        matched: [],
      })
    })

    it.todo('remove aliases')
    it.todo('remove children')
    it.todo('remove aliases children')
  })

  it('can remove records by name', () => {
    const matcher = createRouterMatcher([], {})
    matcher.addRoute({ path: '/', component, name: 'home' })
    matcher.removeRoute('home')
    expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })
  })

  it('removes children', () => {
    const matcher = createRouterMatcher([], {})
    matcher.addRoute({
      path: '/',
      component,
      name: 'home',
      children: [
        // absolute path so it can work out
        { path: '/about', component },
      ],
    })

    matcher.removeRoute('home')
    expect(matcher.resolve({ path: '/about' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })
  })

  it.todo('removes alias by name')
  it.todo('removes children by name')
  it.todo('removes children alias by name')
})
