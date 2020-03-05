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

  it('adds children', () => {
    const matcher = createRouterMatcher([], {})
    matcher.addRoute({ path: '/parent', component, name: 'home' })
    const parent = matcher.getRecordMatcher('home')
    matcher.addRoute({ path: 'foo', component, name: 'foo' }, parent)
    expect(
      matcher.resolve({ path: '/parent/foo' }, currentLocation)
    ).toMatchObject({
      name: 'foo',
      matched: [
        expect.objectContaining({ name: 'home' }),
        expect.objectContaining({ name: 'foo' }),
      ],
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

    it('remove children but not parent', () => {
      const matcher = createRouterMatcher(
        [{ path: '/', component, name: 'home' }],
        {}
      )
      const remove = matcher.addRoute(
        { path: 'foo', component, name: 'child' },
        matcher.getRecordMatcher('home')
      )
      remove()
      expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
        name: 'home',
      })
      expect(matcher.resolve({ path: '/foo' }, currentLocation)).toMatchObject({
        name: undefined,
        matched: [],
      })
    })

    it.todo('remove aliases')
    it.todo('remove aliases children')

    it('remove children when removing the parent', () => {
      const matcher = createRouterMatcher([], {})
      const remove = matcher.addRoute({
        path: '/',
        component,
        name: 'home',
        children: [
          // absolute path so it can work out
          { path: '/about', name: 'child', component },
        ],
      })

      remove()

      expect(
        matcher.resolve({ path: '/about' }, currentLocation)
      ).toMatchObject({
        name: undefined,
        matched: [],
      })

      expect(matcher.getRecordMatcher('child')).toBe(undefined)
      expect(() => {
        matcher.resolve({ name: 'child' }, currentLocation)
      }).toThrow()
    })
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

  it('removes children when removing the parent', () => {
    const matcher = createRouterMatcher([], {})
    matcher.addRoute({
      path: '/',
      component,
      name: 'home',
      children: [
        // absolute path so it can work out
        { path: '/about', name: 'child', component },
      ],
    })

    matcher.removeRoute('home')
    expect(matcher.resolve({ path: '/about' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(matcher.getRecordMatcher('child')).toBe(undefined)
    expect(() => {
      matcher.resolve({ name: 'child' }, currentLocation)
    }).toThrow()
  })

  it('removes children by name', () => {
    const matcher = createRouterMatcher([], {})
    matcher.addRoute({
      path: '/',
      component,
      name: 'home',
      children: [
        // absolute path so it can work out
        { path: '/about', name: 'child', component },
      ],
    })

    matcher.removeRoute('child')

    expect(matcher.resolve({ path: '/about' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(matcher.getRecordMatcher('child')).toBe(undefined)
    expect(() => {
      matcher.resolve({ name: 'child' }, currentLocation)
    }).toThrow()

    expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
      name: 'home',
    })
  })

  it('removes children by name from parent', () => {
    const matcher = createRouterMatcher([], {})
    matcher.addRoute({
      path: '/',
      component,
      name: 'home',
      children: [
        // absolute path so it can work out
        { path: '/about', name: 'child', component },
      ],
    })

    matcher.removeRoute('home')

    expect(matcher.resolve({ path: '/about' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(matcher.getRecordMatcher('child')).toBe(undefined)
  })

  it.todo('removes alias by name')

  it.todo('removes children alias by name')
})
