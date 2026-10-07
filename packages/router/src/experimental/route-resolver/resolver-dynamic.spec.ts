import { describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { createDynamicResolver } from './resolver-dynamic'
import { NO_MATCH_LOCATION } from './resolver-abstract'
import type { MatcherPatternPathParser } from './matchers/matcher-pattern-path-parser'
import type { RouteComponent, RouteRecordRaw } from '../../types'
import type { PathParserOptions } from '../../matcher/pathParserRanker'
import { mockWarn } from '../../../__tests__/vitest-mock-warn'

const component: RouteComponent = {}

const NO_MATCH = {
  name: NO_MATCH_LOCATION.name,
  matched: [],
}

describe('createDynamicResolver', () => {
  describe('adding and removing records', () => {
    it('can add records', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/', component, name: 'home' })
      expect(resolver.resolve('/')).toMatchObject({ name: 'home' })
      expect(resolver.resolve({ path: '/' })).toMatchObject({ name: 'home' })
    })

    it('can remove all records', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/', component })
      resolver.addRoute({ path: '/about', component, name: 'about' })
      resolver.addRoute({
        path: '/with-children',
        component,
        children: [{ path: 'child', component }],
      })
      expect(resolver.getRoutes()).not.toHaveLength(0)
      resolver.clearRoutes()
      expect(resolver.getRoutes()).toHaveLength(0)
      expect(resolver.getRoute('about')).toBeFalsy()
      expect(resolver.resolve('/about')).toMatchObject(NO_MATCH)
      expect(resolver.resolve('/with-children/child')).toMatchObject(NO_MATCH)
    })

    it('can add records after clearing them', () => {
      const resolver = createDynamicResolver([
        { path: '/', component, name: 'home' },
      ])
      resolver.clearRoutes()
      resolver.addRoute({ path: '/', component, name: 'other' })
      expect(resolver.resolve('/')).toMatchObject({ name: 'other' })
      expect(resolver.getRoutes()).toHaveLength(1)
    })

    it('throws when adding *', () => {
      const resolver = createDynamicResolver()
      expect(() => {
        resolver.addRoute({ path: '*', component })
      }).toThrowError('Catch all')
    })

    it('does not throw when adding * in children', () => {
      const resolver = createDynamicResolver()
      expect(() => {
        resolver.addRoute({
          path: '/something',
          component,
          children: [{ path: '*', component }],
        })
      }).not.toThrow()
    })

    it('adds children', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/parent', component, name: 'home' })
      resolver.addRoute('home', { path: 'foo', component, name: 'foo' })
      expect(resolver.resolve('/parent/foo')).toMatchObject({
        name: 'foo',
        matched: [
          expect.objectContaining({ name: 'home' }),
          expect.objectContaining({ name: 'foo' }),
        ],
      })
    })

    describe('addRoute returned function', () => {
      it('remove records', () => {
        const resolver = createDynamicResolver()
        const remove = resolver.addRoute({
          path: '/',
          component,
          name: 'home',
        })
        remove()
        expect(resolver.resolve('/')).toMatchObject(NO_MATCH)
        expect(resolver.getRoutes()).toHaveLength(0)
      })

      it('remove children but not parent', () => {
        const resolver = createDynamicResolver([
          { path: '/', component, name: 'home' },
        ])
        const remove = resolver.addRoute('home', {
          path: 'foo',
          component,
          name: 'child',
        })
        remove()
        expect(resolver.resolve('/')).toMatchObject({ name: 'home' })
        expect(resolver.resolve('/foo')).toMatchObject(NO_MATCH)
      })

      it('remove aliases', () => {
        const resolver = createDynamicResolver()
        const remove = resolver.addRoute({
          path: '/',
          component,
          name: 'home',
          alias: ['/home', '/start'],
        })
        remove()
        for (const path of ['/', '/home', '/start'] as const) {
          expect(resolver.resolve(path)).toMatchObject({ path, ...NO_MATCH })
        }
        expect(resolver.getRoutes()).toHaveLength(0)
      })

      it('remove aliases children', () => {
        const resolver = createDynamicResolver()
        const remove = resolver.addRoute({
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
        for (const path of [
          '/',
          '/start',
          '/home',
          '/one/two',
          '/start/one/two',
          '/home/o/two',
          '/home/one/t2',
          '/o2/t',
        ] as const) {
          expect(resolver.resolve(path)).toMatchObject({ path, ...NO_MATCH })
        }
        expect(resolver.getRoutes()).toHaveLength(0)
      })

      it('remove children when removing the parent', () => {
        const resolver = createDynamicResolver()
        const remove = resolver.addRoute({
          path: '/',
          component,
          name: 'home',
          children: [{ path: '/about', name: 'child', component }],
        })

        remove()

        expect(resolver.resolve('/about')).toMatchObject(NO_MATCH)
        expect(resolver.getRoute('child')).toBe(undefined)
        expect(() => {
          resolver.resolve({ name: 'child', params: {} })
        }).toThrow()
      })

      it('removes the children of a pass-through parent', () => {
        const resolver = createDynamicResolver()
        const remove = resolver.addRoute({
          path: '/admin',
          children: [
            { path: '', name: 'admin', component },
            { path: 'users', name: 'admin-users', component },
          ],
        })
        expect(resolver.resolve('/admin/users')).toMatchObject({
          name: 'admin-users',
        })
        expect(resolver.getRoutes()).toHaveLength(2)

        remove()

        expect(resolver.resolve('/admin')).toMatchObject(NO_MATCH)
        expect(resolver.resolve('/admin/users')).toMatchObject(NO_MATCH)
        expect(resolver.getRoute('admin')).toBe(undefined)
        expect(resolver.getRoute('admin-users')).toBe(undefined)
        expect(resolver.getRoutes()).toHaveLength(0)
      })

      it('removes the children of aliases', () => {
        const resolver = createDynamicResolver()
        const remove = resolver.addRoute({
          path: '/users',
          alias: '/people',
          name: 'users',
          component,
          children: [{ path: ':id', name: 'user', component }],
        })
        expect(resolver.resolve('/people/1')).toMatchObject({
          name: 'user',
          params: { id: '1' },
        })

        remove()

        for (const path of [
          '/users',
          '/people',
          '/users/1',
          '/people/1',
        ] as const) {
          expect(resolver.resolve(path)).toMatchObject({ path, ...NO_MATCH })
        }
        expect(resolver.getRoutes()).toHaveLength(0)
      })

      it('does nothing when called twice', () => {
        const resolver = createDynamicResolver()
        const remove = resolver.addRoute({
          path: '/',
          component,
          name: 'home',
        })
        remove()
        resolver.addRoute({ path: '/', component, name: 'home' })
        remove()
        expect(resolver.resolve('/')).toMatchObject({ name: 'home' })
      })
    })

    it('can remove records by name', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/', component, name: 'home' })
      resolver.removeRoute('home')
      expect(resolver.getRoutes()).toHaveLength(0)
      expect(resolver.resolve('/')).toMatchObject(NO_MATCH)
    })

    it('can remove records by record', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/', component, name: 'home' })
      resolver.removeRoute(resolver.getRoute('home')!)
      expect(resolver.getRoutes()).toHaveLength(0)
      expect(resolver.resolve('/')).toMatchObject(NO_MATCH)
    })

    it('removes children when removing the parent', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({
        path: '/',
        component,
        name: 'home',
        children: [{ path: '/about', name: 'child', component }],
      })

      resolver.removeRoute('home')
      expect(resolver.resolve('/about')).toMatchObject(NO_MATCH)
      expect(resolver.getRoute('child')).toBe(undefined)
      expect(() => {
        resolver.resolve({ name: 'child', params: {} })
      }).toThrow()
    })

    it('removes children by name', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({
        path: '/',
        component,
        name: 'home',
        children: [{ path: '/about', name: 'child', component }],
      })

      expect(resolver.getRoutes()).toHaveLength(2)
      resolver.removeRoute('child')
      expect(resolver.getRoutes()).toHaveLength(1)

      expect(resolver.resolve('/about')).toMatchObject(NO_MATCH)
      expect(resolver.getRoute('child')).toBe(undefined)
      expect(() => {
        resolver.resolve({ name: 'child', params: {} })
      }).toThrow()
      expect(resolver.resolve('/')).toMatchObject({ name: 'home' })
    })

    it('removes children by name from parent', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({
        path: '/',
        component,
        name: 'home',
        children: [{ path: '/about', name: 'child', component }],
      })

      resolver.removeRoute('home')
      expect(resolver.getRoutes()).toHaveLength(0)
      expect(resolver.resolve('/about')).toMatchObject(NO_MATCH)
      expect(resolver.getRoute('child')).toBe(undefined)
    })

    it('removes alias (and original) by name', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({
        path: '/',
        alias: '/start',
        component,
        name: 'home',
      })

      resolver.removeRoute('home')
      expect(resolver.getRoutes()).toHaveLength(0)
      expect(resolver.resolve('/start')).toMatchObject(NO_MATCH)
    })

    it('removes all children alias when removing parent by name', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({
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

      // sanity check: all the paths match before the removal
      expect(resolver.resolve('/home/x2/z2').matched).toHaveLength(3)

      resolver.removeRoute('home')
      expect(resolver.getRoutes()).toHaveLength(0)
      for (const path of [
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
      ] as const) {
        expect(resolver.resolve(path)).toMatchObject({ path, ...NO_MATCH })
      }
    })

    it('removes children alias (and original) by name', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({
        path: '/',
        alias: '/start',
        component,
        name: 'home',
        children: [{ path: 'about', alias: 'two', name: 'child', component }],
      })

      resolver.removeRoute('child')

      expect(resolver.getRoutes()).toHaveLength(2)
      for (const path of [
        '/about',
        '/two',
        '/start/about',
        '/start/two',
      ] as const) {
        expect(resolver.resolve(path)).toMatchObject(NO_MATCH)
      }
      expect(resolver.getRoute('child')).toBe(undefined)
      expect(resolver.resolve('/start')).toMatchObject({ name: 'home' })
    })

    it('removes existing record when adding with the same name', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/', component, name: 'home' })
      resolver.addRoute({ path: '/home', component, name: 'home' })
      expect(resolver.getRoutes()).toHaveLength(1)
      expect(resolver.resolve('/home')).toMatchObject({ name: 'home' })
      expect(resolver.resolve('/')).toMatchObject(NO_MATCH)
    })

    it('replaces a route with the same name, with its children and aliases', () => {
      const resolver = createDynamicResolver([
        {
          path: '/users',
          alias: '/people',
          name: 'users',
          component,
          children: [{ path: ':id', name: 'user', component }],
        },
      ])
      const meta = { replaced: true }
      resolver.addRoute({ path: '/members', name: 'users', component, meta })

      expect(resolver.getRoute('users')).toMatchObject({ meta })
      expect(resolver.getRoute('user')).toBe(undefined)
      expect(resolver.getRoutes()).toHaveLength(1)
      expect(resolver.resolve('/members')).toMatchObject({
        name: 'users',
        matched: [expect.objectContaining({ meta })],
      })
      for (const path of ['/users', '/people', '/users/1'] as const) {
        expect(resolver.resolve(path)).toMatchObject(NO_MATCH)
      }
      expect(resolver.resolve({ name: 'users', params: {} })).toMatchObject({
        path: '/members',
      })
    })

    it('throws if a parent and child have the same name', () => {
      expect(() => {
        createDynamicResolver([
          {
            path: '/',
            component,
            name: 'home',
            children: [{ path: '/home', component, name: 'home' }],
          },
        ])
      }).toThrowError(
        'A route named "home" has been added as a child of a route with the same name'
      )
    })

    it('throws if an ancestor and descendant have the same name', () => {
      const name = Symbol('home')
      const resolver = createDynamicResolver([
        {
          path: '/',
          name,
          children: [{ path: 'home', name: 'other', component }],
        },
      ])

      expect(() => {
        resolver.addRoute('other', { path: '', component, name })
      }).toThrowError(
        'A route named "Symbol(home)" has been added as a descendant of a route with the same name'
      )
    })

    it('adds empty paths as children', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/', component, name: 'parent' })
      expect(resolver.resolve('/')).toMatchObject({ name: 'parent' })
      resolver.addRoute('parent', { path: '', component, name: 'child' })
      expect(resolver.resolve('/')).toMatchObject({
        name: 'child',
        matched: [
          expect.objectContaining({ name: 'parent' }),
          expect.objectContaining({ name: 'child' }),
        ],
      })
    })

    it('adding dynamic child with root path', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/parent', component, name: 'parent' })
      expect(resolver.resolve('/parent')).toMatchObject({ name: 'parent' })
      resolver.addRoute('parent', { path: '/:id', component, name: 'child' })
      expect(resolver.resolve('/parent')).toMatchObject({ name: 'parent' })
      expect(resolver.resolve('/other')).toMatchObject({
        name: 'child',
        params: { id: 'other' },
      })
    })

    it('keeps non matchable records in matched but not in getRoutes()', () => {
      const resolver = createDynamicResolver([
        {
          path: '/admin',
          meta: { group: true },
          children: [{ path: 'users', name: 'users', component }],
        },
      ])
      expect(resolver.getRoutes()).toHaveLength(1)
      expect(resolver.resolve('/admin')).toMatchObject(NO_MATCH)
      const { matched } = resolver.resolve('/admin/users')
      expect(matched).toHaveLength(2)
      expect(matched[0]).toMatchObject({ meta: { group: true } })
      expect(matched[0].name).toBe(undefined)
      expect((matched[0].path as MatcherPatternPathParser).path).toBe('/admin')
    })

    it('gives a Symbol name to unnamed matchable records', () => {
      const resolver = createDynamicResolver([{ path: '/about', component }])
      const { name } = resolver.resolve('/about')
      expect(typeof name).toBe('symbol')
      expect(resolver.getRoute(name)).toBe(resolver.getRoutes()[0])
    })

    it('clearRoutes() removes all routes, aliases and children', () => {
      const resolver = createDynamicResolver([
        {
          path: '/users',
          alias: '/people',
          name: 'users',
          component,
          children: [{ path: ':id', name: 'user', component }],
        },
        { path: '/', name: 'home', component },
      ])
      resolver.clearRoutes()
      expect(resolver.getRoutes()).toEqual([])
      expect(resolver.getRoute('users')).toBe(undefined)
      expect(resolver.getRoute('user')).toBe(undefined)
      expect(resolver.getRoute('home')).toBe(undefined)
      for (const path of ['/', '/users', '/people/1', '/users/1'] as const) {
        expect(resolver.resolve(path)).toMatchObject(NO_MATCH)
      }
    })
  })

  describe('reactivity', () => {
    it('updates a computed calling resolve() after addRoute()', () => {
      const resolver = createDynamicResolver()
      const name = computed(() => resolver.resolve('/about').name)
      expect(name.value).toBe(NO_MATCH_LOCATION.name)
      resolver.addRoute({ path: '/about', name: 'about', component })
      expect(name.value).toBe('about')
    })

    it('updates a computed calling resolve() after removeRoute()', () => {
      const resolver = createDynamicResolver([
        { path: '/about', name: 'about', component },
      ])
      const name = computed(() => resolver.resolve('/about').name)
      expect(name.value).toBe('about')
      resolver.removeRoute('about')
      expect(name.value).toBe(NO_MATCH_LOCATION.name)
    })

    it('updates a computed calling resolve() after the returned remove function', () => {
      const resolver = createDynamicResolver()
      const remove = resolver.addRoute({
        path: '/about',
        name: 'about',
        component,
      })
      const name = computed(() => resolver.resolve('/about').name)
      expect(name.value).toBe('about')
      remove()
      expect(name.value).toBe(NO_MATCH_LOCATION.name)
    })

    it('updates a computed calling resolve() after clearRoutes()', () => {
      const resolver = createDynamicResolver([
        { path: '/about', name: 'about', component },
      ])
      const name = computed(() => resolver.resolve('/about').name)
      expect(name.value).toBe('about')
      resolver.clearRoutes()
      expect(name.value).toBe(NO_MATCH_LOCATION.name)
    })

    it('updates a computed when a higher ranked route is added', () => {
      const resolver = createDynamicResolver([
        { path: '/:id', name: 'param', component },
      ])
      const name = computed(() => resolver.resolve('/about').name)
      expect(name.value).toBe('param')
      resolver.addRoute({ path: '/about', name: 'about', component })
      expect(name.value).toBe('about')
    })
  })

  describe('warnings', () => {
    mockWarn()

    it('warns if alias is missing a required param', () => {
      createDynamicResolver([{ path: '/:id', alias: '/no-id', component }])
      expect('same param named "id"').toHaveBeenWarned()
    })

    it('does not warn for optional param on alias', () => {
      createDynamicResolver([
        { path: '/:id', alias: '/:id-:suffix?', component },
      ])
      expect('same param named').not.toHaveBeenWarned()
    })

    it('does not warn for optional param on main record', () => {
      createDynamicResolver([
        { alias: '/:id', path: '/:id-:suffix?', component },
      ])
      expect('same param named').not.toHaveBeenWarned()
    })

    it('warns when adding a child to an unknown parent and adds it at the root', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute('nope', { path: '/child', component })
      expect('VUE_ROUTER_R0001').toHaveBeenWarned()
      expect('Parent route "nope" not found').toHaveBeenWarned()
      const { matched } = resolver.resolve('/child')
      expect(matched).toHaveLength(1)
      expect((matched[0].path as MatcherPatternPathParser).path).toBe('/child')
    })

    it('warns when removing an unknown route', () => {
      const resolver = createDynamicResolver([{ path: '/', component }])
      resolver.removeRoute('nope')
      expect('VUE_ROUTER_R0002').toHaveBeenWarnedTimes(1)
      expect('Cannot remove non-existent route "nope"').toHaveBeenWarned()
      expect(resolver.getRoutes()).toHaveLength(1)
    })

    it('does not warn when adding or replacing named routes', () => {
      const resolver = createDynamicResolver([
        { path: '/', name: 'home', component },
      ])
      resolver.addRoute({ path: '/about', name: 'about', component })
      resolver.addRoute('home', { path: 'child', name: 'child', component })
      resolver.addRoute({ path: '/about-us', name: 'about', component })
      expect('VUE_ROUTER_R0002').not.toHaveBeenWarned()
    })

    it('warns if a named route has an empty non-named child route', () => {
      createDynamicResolver([
        {
          name: 'UserRoute',
          path: '/user/:id',
          component,
          children: [{ path: '', component }],
        },
      ])
      expect('has a child without a name').toHaveBeenWarned()
    })

    it('no warn if both or just the child are named', () => {
      createDynamicResolver([
        {
          name: 'UserRoute',
          path: '/user/:id',
          component,
          children: [{ path: '', name: 'UserHome', component }],
        },
        {
          path: '/',
          component,
          children: [{ path: '', name: 'child', component }],
        },
      ])
      expect('has a child without a name').not.toHaveBeenWarned()
    })

    it('warns if nested child is missing a name', () => {
      createDynamicResolver([
        {
          name: 'parent',
          path: '/a',
          component,
          children: [
            {
              path: 'b',
              name: 'b',
              component,
              children: [{ path: '', component }],
            },
          ],
        },
      ])
      expect('has a child without a name').toHaveBeenWarned()
    })

    it('warns if middle nested child is missing a name', () => {
      createDynamicResolver([
        {
          path: '/a',
          component,
          children: [
            {
              path: '',
              name: 'parent',
              component,
              children: [{ path: '', component }],
            },
          ],
        },
      ])
      expect('has a child without a name').toHaveBeenWarned()
    })

    it('no warn if nested child is named', () => {
      createDynamicResolver([
        {
          name: 'parent',
          path: '/a',
          component,
          children: [
            {
              path: 'b',
              name: 'b',
              component,
              children: [{ path: '', name: 'child', component }],
            },
          ],
        },
      ])
      expect('has a child without a name').not.toHaveBeenWarned()
    })
  })

  describe('path ranking', () => {
    type PathEntry = string | [string, PathParserOptions | undefined]

    const possibleOptions: Array<PathParserOptions | undefined> = [
      undefined,
      { strict: true, sensitive: false },
      { strict: false, sensitive: true },
      { strict: true, sensitive: true },
    ]

    function normalize(entry: PathEntry) {
      const [path, options] = typeof entry === 'string' ? [entry] : entry
      return {
        id: path + (options ? JSON.stringify(options) : ''),
        path,
        options,
      }
    }

    /**
     * Adds the routes in different orders and checks that `getRoutes()` follows
     * the order of `paths` and that each url resolves to the expected route.
     *
     * @param paths - paths from highest to lowest priority
     * @param urls - urls with the index of the path they must resolve to
     */
    function checkPathOrder(
      paths: PathEntry[],
      urls: Array<[`/${string}`, number]> = []
    ) {
      const entries = paths.map(normalize)
      const toRecord = ({
        id,
        path,
        options,
      }: (typeof entries)[number]): RouteRecordRaw => ({
        path,
        name: id,
        component,
        ...options,
      })

      const orders = [
        entries.slice().reverse(),
        entries,
        // interleave: odd indexes first, then even
        [
          ...entries.filter((_, i) => i % 2),
          ...entries.filter((_, i) => !(i % 2)),
        ],
      ]

      const expectedIds = entries.map(e => e.id)

      for (const order of orders) {
        const fromAddRoute = createDynamicResolver()
        for (const entry of order) fromAddRoute.addRoute(toRecord(entry))
        const fromInitial = createDynamicResolver(order.map(toRecord))

        for (const resolver of [fromAddRoute, fromInitial]) {
          expect(resolver.getRoutes().map(r => r.name)).toEqual(expectedIds)
          for (const [url, index] of urls) {
            expect(
              resolver.resolve(url).name,
              `"${url}" should resolve to "${expectedIds[index]}"`
            ).toBe(expectedIds[index])
          }
        }
      }
    }

    it('works', () => {
      checkPathOrder(
        [
          '/a/b/c',
          '/a/b',
          '/a/:b/c',
          '/a/:b',
          '/a',
          '/a-:b-:c',
          '/a-:b',
          '/a-:w(.*)',
          '/:a-:b-:c',
          '/:a-:b',
          '/:a-:b(.*)',
          '/:a/-:b',
          '/:a/:b',
          '/:w',
          '/:w+',
        ],
        [
          ['/a/b/c', 0],
          ['/a/b', 1],
          ['/a/x/c', 2],
          ['/a/x', 3],
          ['/a', 4],
          ['/a-x-y', 5],
          ['/a-x', 6],
          ['/a-x/y', 7],
          ['/x-y-z', 8],
          ['/x-y', 9],
          ['/x-y/z', 10],
          ['/x/-y', 11],
          ['/x/y', 12],
          ['/x', 13],
          ['/x/y/z', 14],
        ]
      )
    })

    it('puts the slash before optional parameters', () => {
      for (const options of possibleOptions) {
        checkPathOrder(
          ['/', ['/:a?', options]],
          [
            ['/', 0],
            ['/x', 1],
          ]
        )
        checkPathOrder(
          ['/', ['/:a*', options]],
          [
            ['/', 0],
            ['/x/y', 1],
          ]
        )
        checkPathOrder(
          ['/', ['/:a(\\d+)?', options]],
          [
            ['/', 0],
            ['/1', 1],
          ]
        )
        checkPathOrder(
          ['/', ['/:a(\\d+)*', options]],
          [
            ['/', 0],
            ['/1/2', 1],
          ]
        )
      }
    })

    it('puts catchall param after same prefix', () => {
      for (const options of possibleOptions) {
        checkPathOrder(
          [
            ['/a', options],
            ['/a/:a(.*)*', options],
          ],
          [
            ['/a', 0],
            ['/a/b/c', 1],
          ]
        )
      }
    })

    it('sensitive should go before non sensitive', () => {
      checkPathOrder(
        [
          ['/Home', { sensitive: true }],
          ['/home', {}],
        ],
        [
          ['/Home', 0],
          ['/home', 1],
          ['/HOME', 1],
        ]
      )
      checkPathOrder(
        [
          ['/:w', { sensitive: true }],
          ['/:w', {}],
        ],
        [['/x', 0]]
      )
    })

    it('strict should go before non strict', () => {
      checkPathOrder(
        [
          ['/home', { strict: true }],
          ['/home', {}],
        ],
        [
          ['/home', 0],
          ['/home/', 1],
        ]
      )
    })

    it('orders repeatable and optional', () => {
      for (const options of possibleOptions) {
        checkPathOrder(['/:w', ['/:w?', options]], [['/x', 0]])
        checkPathOrder(
          ['/:w?', ['/:w+', options]],
          [
            ['/x', 0],
            ['/x/y', 1],
          ]
        )
        checkPathOrder(
          ['/:w+', ['/:w*', options]],
          [
            ['/x', 0],
            ['/x/y', 0],
          ]
        )
        checkPathOrder(['/:w+', ['/:w(.*)', options]], [['/x/y', 0]])
      }
    })

    it('orders static before params', () => {
      for (const options of possibleOptions) {
        checkPathOrder(
          ['/a', ['/:id', options]],
          [
            ['/a', 0],
            ['/b', 1],
          ]
        )
      }
    })

    it('empty path before slash', () => {
      for (const options of possibleOptions) {
        checkPathOrder(['', ['/', options]], [['/', 0]])
      }
    })

    it('works with long paths', () => {
      checkPathOrder(
        ['/a/b/c/d/e', '/:k/b/c/d/e', '/:k/b/c/d/:j'],
        [
          ['/a/b/c/d/e', 0],
          ['/x/b/c/d/e', 1],
          ['/x/b/c/d/y', 2],
        ]
      )
    })

    it('prioritizes custom regex', () => {
      checkPathOrder(
        ['/:a(\\d+)', '/:a', '/:a(.*)'],
        [
          ['/1', 0],
          ['/x', 1],
          ['/x/y', 2],
        ]
      )
      checkPathOrder(
        ['/b-:a(\\d+)', '/b-:a', '/b-:a(.*)'],
        [
          ['/b-1', 0],
          ['/b-x', 1],
          ['/b-x/y', 2],
        ]
      )
    })

    it('prioritizes ending slashes', () => {
      checkPathOrder(['/a/', '/a'], [['/a/', 0]])
      checkPathOrder(['/a/b/', '/a/b'], [['/a/b/', 0]])
      checkPathOrder(
        [['/a/', { strict: true }], '/a/'],
        [
          ['/a/', 0],
          ['/a', 1],
        ]
      )
      checkPathOrder(
        [['/a', { strict: true }], '/a'],
        [
          ['/a', 0],
          ['/a/', 1],
        ]
      )
    })

    it('puts the wildcard at the end', () => {
      const cases: Array<[string, `/${string}` | null]> = [
        ['', null],
        ['/', '/'],
        ['/ab', '/ab'],
        ['/:a', '/x'],
        ['/:a?', '/x'],
        ['/:a+', '/x/y'],
        ['/:a*', '/x/y'],
        ['/:a(\\d+)', '/1'],
        ['/:a(\\d+)?', '/1'],
        ['/:a(\\d+)+', '/1/2'],
        ['/:a(\\d+)*', '/1/2'],
      ]
      for (const options of possibleOptions) {
        for (const [path, url] of cases) {
          checkPathOrder([[path, options], '/:rest(.*)'], url ? [[url, 0]] : [])
        }
      }
      // the wildcard catches the rest
      checkPathOrder(['/:a(\\d+)', '/:rest(.*)'], [['/x', 1]])
    })

    it('handles sub segments', () => {
      checkPathOrder(
        [
          '/a/_2_',
          // something like /a/_23_
          '/a/_:b(\\d)other',
          '/a/_:b(\\d)?other',
          '/a/_:b-other', // the _ is escaped but b can be also letters
          '/a/a_:b',
        ],
        [
          ['/a/_2_', 0],
          ['/a/_3other', 1],
          ['/a/_other', 2],
          ['/a/_x-other', 3],
          ['/a/a_x', 4],
        ]
      )
    })

    it('handles repeatable and optional in sub segments', () => {
      checkPathOrder(
        ['/a/_:b-other', '/a/_:b?-other', '/a/_:b+-other', '/a/_:b*-other'],
        [
          ['/a/_x-other', 0],
          ['/a/_-other', 1],
        ]
      )
      checkPathOrder(
        [
          '/a/_:b(\\d)-other',
          '/a/_:b(\\d)?-other',
          '/a/_:b(\\d)+-other',
          '/a/_:b(\\d)*-other',
        ],
        [
          ['/a/_1-other', 0],
          ['/a/_-other', 1],
        ]
      )
    })

    it('ending slashes less than params', () => {
      checkPathOrder(
        [
          ['/a/b', { strict: false }],
          ['/a/:b', { strict: true }],
          ['/a/:b/', { strict: true }],
        ],
        [
          ['/a/b', 0],
          ['/a/x', 1],
          ['/a/x/', 2],
        ]
      )
    })

    it('puts children before their parent when they have the same score', () => {
      for (const children of [
        [{ path: '', name: 'child', component }],
        [{ path: '/', name: 'child', component }],
      ]) {
        const resolver = createDynamicResolver([
          { path: '/', name: 'parent', component, children },
        ])
        expect(resolver.resolve('/').name).toBe('child')
      }
    })

    it('keeps insertion order for routes with the same score', () => {
      const resolver = createDynamicResolver([
        { path: '/:a', name: 'first', component },
      ])
      resolver.addRoute({ path: '/:b', name: 'second', component })
      expect(resolver.resolve('/x').name).toBe('first')
    })
  })
})
