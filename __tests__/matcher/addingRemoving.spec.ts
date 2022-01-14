import { createRouterMatcher, RouterMatcher } from '../../src/matcher'
import { MatcherLocation } from '../../src/types'
import { mockWarn } from 'jest-mock-warn'

const currentLocation = { path: '/' } as MatcherLocation
// @ts-expect-error
const component: RouteComponent = null

describe('Matcher: adding and removing records', () => {
  let matcher: RouterMatcher

  beforeEach(() => {
    matcher = createRouterMatcher([], {})
  })

  it('can add records', () => {
    matcher.addRoute({ path: '/', component, name: 'home' })
    expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
      name: 'home',
    })
  })

  it('throws when adding *', () => {
    expect(() => {
      matcher.addRoute({ path: '*', component })
    }).toThrowError('Catch all')
  })

  it('does not throw when adding * in children', () => {
    expect(() => {
      matcher.addRoute({
        path: '/something',
        component,
        children: [{ path: '*', component }],
      })
    }).not.toThrow()
  })

  it('adds children', () => {
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

    it('remove aliases', () => {
      const remove = matcher.addRoute({
        path: '/',
        component,
        name: 'home',
        alias: ['/home', '/start'],
      })
      remove()
      expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
        path: '/',
        name: undefined,
        matched: [],
      })
      expect(matcher.resolve({ path: '/home' }, currentLocation)).toMatchObject(
        {
          path: '/home',
          name: undefined,
          matched: [],
        }
      )
      expect(
        matcher.resolve({ path: '/start' }, currentLocation)
      ).toMatchObject({
        path: '/start',
        name: undefined,
        matched: [],
      })
    })

    it('remove aliases children', () => {
      const remove = matcher.addRoute({
        path: '/',
        component,
        name: 'home',
        alias: ['/home', '/start'],
        children: [
          {
            path: 'one',
            alias: ['o, o2'],
            component,
            children: [{ path: 'two', alias: ['t', 't2'], component }],
          },
        ],
      })
      remove()
      ;[
        '/',
        '/start',
        '/home',
        '/one/two',
        '/start/one/two',
        '/home/o/two',
        '/home/one/t2',
        '/o2/t',
      ].forEach(path => {
        expect(matcher.resolve({ path }, currentLocation)).toMatchObject({
          path,
          name: undefined,
          matched: [],
        })
      })
    })

    it('remove children when removing the parent', () => {
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
    matcher.addRoute({ path: '/', component, name: 'home' })
    matcher.removeRoute('home')
    expect(matcher.getRoutes()).toHaveLength(0)
    expect(matcher.resolve({ path: '/' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })
  })

  it('removes children when removing the parent', () => {
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
    matcher.addRoute({
      path: '/',
      component,
      name: 'home',
      children: [
        // absolute path so it can work out
        { path: '/about', name: 'child', component },
      ],
    })

    expect(matcher.getRoutes()).toHaveLength(2)
    matcher.removeRoute('child')
    expect(matcher.getRoutes()).toHaveLength(1)

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
    expect(matcher.getRoutes()).toHaveLength(0)

    expect(matcher.resolve({ path: '/about' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(matcher.getRecordMatcher('child')).toBe(undefined)
  })

  it('removes alias (and original) by name', () => {
    matcher.addRoute({
      path: '/',
      alias: '/start',
      component,
      name: 'home',
    })

    matcher.removeRoute('home')
    expect(matcher.getRoutes()).toHaveLength(0)

    expect(matcher.resolve({ path: '/start' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })
  })

  it('removes all children alias when removing parent by name', () => {
    matcher.addRoute({
      path: '/',
      alias: ['/start', '/home'],
      component,
      name: 'home',
      children: [
        {
          path: 'one',
          alias: ['o', 'o2'],
          component,
          children: [{ path: 'two', alias: ['t', 't2'], component }],
        },
        {
          path: 'xxx',
          alias: ['x', 'x2'],
          component,
          children: [
            { path: 'yyy', alias: ['y', 'y2'], component },
            { path: 'zzz', alias: ['z', 'z2'], component },
          ],
        },
      ],
    })

    matcher.removeRoute('home')
    expect(matcher.getRoutes()).toHaveLength(0)
    ;[
      '/',
      '/start',
      '/home',
      '/one/two',
      '/start/one/two',
      '/home/o/two',
      '/home/one/t2',
      '/o2/t',
      '/xxx/yyy',
      '/x/yyy',
      '/x2/yyy',
      '/x2/y',
      '/x2/y2',
      '/x2/zzz',
      '/x2/z',
      '/x2/z2',
      '/start/xxx/yyy',
      '/home/xxx/yyy',
      '/home/xxx/z2',
      '/home/x2/z2',
    ].forEach(path => {
      expect(matcher.resolve({ path }, currentLocation)).toMatchObject({
        path,
        name: undefined,
        matched: [],
      })
    })
  })

  it('removes children alias (and original) by name', () => {
    matcher.addRoute({
      path: '/',
      alias: '/start',
      component,
      name: 'home',
      children: [{ path: 'about', alias: 'two', name: 'child', component }],
    })

    matcher.removeRoute('child')

    expect(matcher.getRoutes()).toHaveLength(2)

    expect(matcher.resolve({ path: '/about' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(matcher.resolve({ path: '/two' }, currentLocation)).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(
      matcher.resolve({ path: '/start/about' }, currentLocation)
    ).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(
      matcher.resolve({ path: '/start/two' }, currentLocation)
    ).toMatchObject({
      name: undefined,
      matched: [],
    })

    expect(matcher.getRecordMatcher('child')).toBe(undefined)
  })

  it('removes existing record when adding with the same name', () => {
    matcher.addRoute({ path: '/', component, name: 'home' })
    matcher.addRoute({ path: '/home', component, name: 'home' })
    expect(matcher.getRoutes()).toHaveLength(1)
    expect(matcher.resolve({ path: '/home' }, currentLocation)).toMatchObject({
      name: 'home',
    })
  })

  describe('warnings', () => {
    mockWarn()

    it('warns if alias is missing a required param', () => {
      createRouterMatcher([{ path: '/:id', alias: '/no-id', component }], {})
      expect('same param named "id"').toHaveBeenWarned()
    })

    it('does not warn for optional param on alias', () => {
      createRouterMatcher(
        [{ path: '/:id', alias: '/:id-:suffix?', component }],
        {}
      )
      expect('same param named').not.toHaveBeenWarned()
    })

    it('does not warn for optional param on main record', () => {
      createRouterMatcher(
        [{ alias: '/:id', path: '/:id-:suffix?', component }],
        {}
      )
      expect('same param named').not.toHaveBeenWarned()
    })
  })
})
