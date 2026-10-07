import { describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { createDynamicResolver } from './resolver-dynamic'
import { NO_MATCH_LOCATION } from './resolver-abstract'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './matchers/matcher-pattern'
import { PARAM_PARSER_INT } from './matchers/param-parsers'
import { normalizeRouteRecord } from '../router'
import type { RouteComponent, RouteRecordRaw } from '../../types'
import { mockWarn } from '../../../__tests__/vitest-mock-warn'

const component: RouteComponent = {}

const NO_MATCH = {
  name: NO_MATCH_LOCATION.name,
  matched: [],
}

describe('createDynamicResolver', () => {
  mockWarn()

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
      expect(matched[0].path?.build({})).toBe('/admin')
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
      expect(matched[0].path?.build({})).toBe('/child')
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
    /**
     * Adds the routes in different orders and checks that `getRoutes()` follows
     * the order of `paths` and that each url resolves to the expected route.
     *
     * @param paths - paths from highest to lowest priority
     * @param urls - urls with the index of the path they must resolve to
     */
    function checkPathOrder(
      paths: string[],
      urls: Array<[`/${string}`, number]> = []
    ) {
      const toRecord = (path: string): RouteRecordRaw => ({
        path,
        name: path,
        component,
      })

      const orders = [
        paths.slice().reverse(),
        paths,
        // interleave: odd indexes first, then even
        [...paths.filter((_, i) => i % 2), ...paths.filter((_, i) => !(i % 2))],
      ]

      for (const order of orders) {
        const fromAddRoute = createDynamicResolver()
        for (const path of order) fromAddRoute.addRoute(toRecord(path))
        const fromInitial = createDynamicResolver(order.map(toRecord))

        for (const resolver of [fromAddRoute, fromInitial]) {
          expect(resolver.getRoutes().map(r => r.name)).toEqual(paths)
          for (const [url, index] of urls) {
            expect(
              resolver.resolve(url).name,
              `"${url}" should resolve to "${paths[index]}"`
            ).toBe(paths[index])
          }
        }
      }
    }

    /**
     * Checks that routes with the same score keep their insertion order.
     *
     * @param paths - paths with the same score
     * @param url - url that all the paths match
     */
    function checkSameScore(paths: string[], url?: `/${string}`) {
      for (const order of [paths, paths.slice().reverse()]) {
        const resolver = createDynamicResolver(
          order.map(path => ({ path, name: path, component }))
        )
        expect(resolver.getRoutes().map(r => r.name)).toEqual(order)
        if (url) expect(resolver.resolve(url).name).toBe(order[0])
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
      checkPathOrder(
        ['/', '/:a?'],
        [
          ['/', 0],
          ['/x', 1],
        ]
      )
      checkPathOrder(
        ['/', '/:a*'],
        [
          ['/', 0],
          ['/x/y', 1],
        ]
      )
      checkPathOrder(
        ['/', '/:a(\\d+)?'],
        [
          ['/', 0],
          ['/1', 1],
        ]
      )
      checkPathOrder(
        ['/', '/:a(\\d+)*'],
        [
          ['/', 0],
          ['/1/2', 1],
        ]
      )
    })

    it('puts catchall param after same prefix', () => {
      checkPathOrder(
        ['/a', '/a/:a(.*)*'],
        [
          ['/a', 0],
          ['/a/b/c', 1],
        ]
      )
    })

    // removed: "sensitive should go before non sensitive" and "strict should
    // go before non strict". The options are ignored, so there are no
    // bonuses anymore.

    it('orders repeatable and optional', () => {
      checkPathOrder(['/:w', '/:w?'], [['/x', 0]])
      checkPathOrder(
        ['/:w?', '/:w+'],
        [
          ['/x', 0],
          ['/x/y', 1],
        ]
      )
      checkPathOrder(
        ['/:w+', '/:w*'],
        [
          ['/x', 0],
          ['/x/y', 0],
        ]
      )
      checkPathOrder(['/:w+', '/:w(.*)'], [['/x/y', 0]])
    })

    it('orders static before params', () => {
      checkPathOrder(
        ['/a', '/:id'],
        [
          ['/a', 0],
          ['/b', 1],
        ]
      )
    })

    // removed: "empty path before slash". It relied on a bonus of the
    // classic ranker. See the "matches / with an empty root path" test.

    // BUG: parseClassicPath('') creates a static pattern '' that never
    // matches. The classic router matched "/" with a root `path: ''`
    it.fails('matches / with an empty root path', () => {
      const resolver = createDynamicResolver([
        { path: '', name: 'empty', component },
      ])
      expect(resolver.resolve('/').name).toBe('empty')
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

    // custom regexps do not give a bonus anymore: "prioritizes custom regex"
    // is replaced by this test
    it('ranks custom regexps like plain params', () => {
      checkSameScore(['/:a(\\d+)', '/:a'], '/1')
      checkSameScore(['/b-:a(\\d+)', '/b-:a'], '/b-1')
      checkPathOrder(['/:a', '/:a(.*)'], [['/x/y', 1]])
      checkPathOrder(['/b-:a', '/b-:a(.*)'], [['/b-x/y', 1]])
    })

    // trailing slashes do not give a bonus anymore: "prioritizes ending
    // slashes" and "ending slashes less than params" are replaced by this test
    it('ranks trailing slashes like paths without them', () => {
      for (const paths of [
        ['/a/', '/a'],
        ['/a/b/', '/a/b'],
        ['/a/:b/', '/a/:b'],
      ]) {
        for (const order of [paths, paths.slice().reverse()]) {
          const resolver = createDynamicResolver(
            order.map(path => ({ path, name: path, component }))
          )
          expect(resolver.getRoutes().map(r => r.name)).toEqual(order)
        }
      }
      checkPathOrder(
        ['/a/b', '/a/:b'],
        [
          ['/a/b', 0],
          ['/a/x', 1],
        ]
      )
      const resolver = createDynamicResolver([
        { path: '/a/:b', name: 'no-slash', component },
        { path: '/a/:b/', name: 'slash', component },
      ])
      expect(resolver.resolve('/a/x').name).toBe('no-slash')
      expect(resolver.resolve('/a/x/').name).toBe('slash')
    })

    it('puts the wildcard at the end', () => {
      const cases: Array<[string, `/${string}`]> = [
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
      for (const [path, url] of cases) {
        checkPathOrder([path, '/:rest(.*)'], [[url, 0]])
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
          // a static and a param rank above an optional param in the middle
          '/a/a_:b',
          '/a/_:b(\\d)?other',
        ],
        [
          ['/a/_2_', 0],
          ['/a/_3other', 1],
          ['/a/a_x', 2],
          ['/a/_other', 3],
        ]
      )
      // without the regexp bonus, it has the same score as "/a/_:b(\\d)other"
      checkSameScore(['/a/_:b(\\d)other', '/a/_:b-other'])
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

  describe('experimental records', () => {
    const components = { default: component }

    function createUsersRecord() {
      return normalizeRouteRecord({
        name: 'users',
        path: new MatcherPatternPathStatic('/users'),
        components,
      })
    }

    function createUserRecord() {
      return normalizeRouteRecord({
        name: 'user',
        path: new MatcherPatternPathDynamic(
          /^\/users\/([^/]+?)$/i,
          { id: [PARAM_PARSER_INT] },
          ['users', 1]
        ),
        components,
      })
    }

    it('accepts experimental records mixed with classic records', () => {
      const users = createUsersRecord()
      const resolver = createDynamicResolver([
        users,
        { path: '/about', name: 'about', component },
        {
          name: 'users-new',
          path: new MatcherPatternPathStatic('/users/new'),
          components,
          parent: users,
        },
      ])
      expect(resolver.resolve('/about').name).toBe('about')
      expect(resolver.resolve('/users').name).toBe('users')
      expect(resolver.resolve('/users/new')).toMatchObject({
        name: 'users-new',
        matched: [users, expect.objectContaining({ name: 'users-new' })],
      })
    })

    it('ranks experimental and classic records together', () => {
      for (const reversed of [false, true]) {
        const records = [
          createUserRecord(),
          { path: '/users/new', name: 'users-new', component },
          { path: '/users/:id/:tab', name: 'user-tab', component },
          normalizeRouteRecord({
            name: 'users-me',
            path: new MatcherPatternPathStatic('/users/me'),
            components,
          }),
        ]
        if (reversed) records.reverse()
        const resolver = createDynamicResolver(records)
        expect(resolver.resolve('/users/new').name).toBe('users-new')
        expect(resolver.resolve('/users/me').name).toBe('users-me')
        expect(resolver.resolve('/users/1')).toMatchObject({
          name: 'user',
          params: { id: 1 },
        })
        expect(resolver.resolve('/users/1/posts').name).toBe('user-tab')
      }
    })

    it('adds experimental records with addRoute()', () => {
      const resolver = createDynamicResolver([
        { path: '/users/:id', name: 'user', component },
      ])
      const users = createUsersRecord()
      resolver.addRoute(users)
      resolver.addRoute(
        normalizeRouteRecord({
          name: 'users-new',
          path: new MatcherPatternPathStatic('/users/new'),
          components,
          parent: users,
        })
      )
      expect(resolver.resolve('/users').name).toBe('users')
      // ranked above the classic param record added before
      expect(resolver.resolve('/users/new')).toMatchObject({
        name: 'users-new',
        matched: [users, expect.objectContaining({ name: 'users-new' })],
      })
      expect(resolver.resolve('/users/1').name).toBe('user')
    })

    it('adds an experimental record as a child with addRoute(parentName)', () => {
      const users = createUsersRecord()
      const resolver = createDynamicResolver([users])
      resolver.addRoute('users', {
        name: 'users-new',
        path: new MatcherPatternPathStatic('/users/new'),
        components,
      })
      expect(resolver.resolve('/users/new').matched).toEqual([
        users,
        expect.objectContaining({ name: 'users-new' }),
      ])
    })

    it('adds a classic relative child to an experimental parent', () => {
      const user = createUserRecord()
      const resolver = createDynamicResolver([user])
      resolver.addRoute('user', { path: 'posts', name: 'posts', component })

      // the child reuses the param parser of the parent
      expect(resolver.resolve('/users/42/posts')).toMatchObject({
        name: 'posts',
        params: { id: 42 },
        matched: [user, expect.objectContaining({ name: 'posts' })],
      })
      expect(resolver.resolve({ name: 'posts', params: { id: 7 } }).path).toBe(
        '/users/7/posts'
      )
      // the int parser rejects the value
      expect(resolver.resolve('/users/abc/posts')).toMatchObject(NO_MATCH)
    })

    it('adds a classic relative child to an experimental static parent', () => {
      const users = createUsersRecord()
      const resolver = createDynamicResolver([users])
      resolver.addRoute('users', { path: ':id', name: 'user', component })
      expect(resolver.resolve('/users/1')).toMatchObject({
        name: 'user',
        params: { id: '1' },
        matched: [users, expect.objectContaining({ name: 'user' })],
      })
    })

    it('removes the children of an experimental parent', () => {
      const users = createUsersRecord()
      const resolver = createDynamicResolver([
        users,
        normalizeRouteRecord({
          name: 'users-new',
          path: new MatcherPatternPathStatic('/users/new'),
          components,
          parent: users,
        }),
      ])
      resolver.addRoute('users', { path: ':id', name: 'user', component })
      expect(resolver.getRoutes()).toHaveLength(3)

      resolver.removeRoute('users')
      expect(resolver.getRoutes()).toHaveLength(0)
      for (const path of ['/users', '/users/new', '/users/1'] as const) {
        expect(resolver.resolve(path)).toMatchObject(NO_MATCH)
      }
      expect(resolver.getRoute('user')).toBeUndefined()
      expect(resolver.getRoute('users-new')).toBeUndefined()
    })
  })

  describe('_hmrUpdate', () => {
    type HmrResolver = { _hmrUpdate(newResolver: object): void }

    function hmrUpdate(resolver: object, newResolver: object) {
      ;(resolver as HmrResolver)._hmrUpdate(newResolver)
    }

    it('is not enumerable', () => {
      const resolver = createDynamicResolver()
      expect(typeof (resolver as unknown as HmrResolver)._hmrUpdate).toBe(
        'function'
      )
      expect(Object.keys(resolver)).not.toContain('_hmrUpdate')
    })

    it('replaces the initial records', () => {
      const resolver = createDynamicResolver([
        { path: '/', name: 'home', component },
        { path: '/old', name: 'old', component },
      ])
      hmrUpdate(
        resolver,
        createDynamicResolver([
          { path: '/', name: 'new-home', component },
          { path: '/new', name: 'new', component },
        ])
      )
      expect(resolver.resolve('/').name).toBe('new-home')
      expect(resolver.resolve('/new').name).toBe('new')
      expect(resolver.resolve('/old')).toMatchObject(NO_MATCH)
      expect(resolver.getRoute('old')).toBeUndefined()
      expect(resolver.getRoutes().map(r => r.name)).toEqual(['new-home', 'new'])
    })

    it('keeps the routes added with addRoute()', () => {
      const resolver = createDynamicResolver([
        { path: '/', name: 'home', component },
        { path: '/parent', name: 'parent', component },
      ])
      resolver.addRoute({ path: '/added', name: 'added', component })
      resolver.addRoute('parent', { path: 'child', name: 'child', component })

      const newResolver = createDynamicResolver([
        { path: '/', name: 'home', component },
        { path: '/new-parent', name: 'parent', component },
      ])
      hmrUpdate(resolver, newResolver)

      expect(resolver.resolve('/added').name).toBe('added')
      // the child is attached to the new parent with the same name
      const loc = resolver.resolve('/new-parent/child')
      expect(loc.name).toBe('child')
      expect(loc.matched).toEqual([
        resolver.getRoute('parent'),
        resolver.getRoute('child'),
      ])
      expect(resolver.resolve('/parent/child')).toMatchObject(NO_MATCH)
      expect(resolver.resolve('/parent')).toMatchObject(NO_MATCH)
    })

    it('keeps an experimental child added to an initial record', () => {
      const parent = normalizeRouteRecord({
        name: 'parent',
        path: new MatcherPatternPathStatic('/parent'),
        components: { default: component },
      })
      const resolver = createDynamicResolver([parent])
      resolver.addRoute({
        name: 'child',
        path: new MatcherPatternPathStatic('/parent/child'),
        components: { default: component },
        parent,
      })

      const newParent = normalizeRouteRecord({
        name: 'parent',
        path: new MatcherPatternPathStatic('/parent'),
        components: { default: component },
        meta: { updated: true },
      })
      hmrUpdate(resolver, createDynamicResolver([newParent]))

      expect(resolver.resolve('/parent/child').matched).toEqual([
        newParent,
        expect.objectContaining({ name: 'child' }),
      ])
    })

    it('does not add again the routes removed before', () => {
      const resolver = createDynamicResolver([
        { path: '/parent', name: 'parent', component },
      ])
      const remove = resolver.addRoute({
        path: '/removed',
        name: 'removed',
        component,
      })
      resolver.addRoute({ path: '/by-name', name: 'by-name', component })
      resolver.addRoute('parent', { path: 'child', name: 'child', component })
      remove()
      resolver.removeRoute('by-name')
      // removes the child added with addRoute()
      resolver.removeRoute('parent')

      hmrUpdate(
        resolver,
        createDynamicResolver([{ path: '/parent', name: 'parent', component }])
      )
      expect(resolver.resolve('/removed')).toMatchObject(NO_MATCH)
      expect(resolver.resolve('/by-name')).toMatchObject(NO_MATCH)
      expect(resolver.resolve('/parent').name).toBe('parent')
      expect(resolver.resolve('/parent/child')).toMatchObject(NO_MATCH)
      expect(resolver.getRoutes()).toHaveLength(1)
    })

    it('does not add again the routes added before clearRoutes()', () => {
      const resolver = createDynamicResolver()
      resolver.addRoute({ path: '/a', name: 'a', component })
      resolver.clearRoutes()
      hmrUpdate(resolver, createDynamicResolver())
      expect(resolver.getRoutes()).toHaveLength(0)
    })

    it('updates a computed calling resolve()', () => {
      const resolver = createDynamicResolver([
        { path: '/a', name: 'old', component },
      ])
      const name = computed(() => resolver.resolve('/a').name)
      expect(name.value).toBe('old')
      hmrUpdate(
        resolver,
        createDynamicResolver([{ path: '/a', name: 'new', component }])
      )
      expect(name.value).toBe('new')
    })
  })
})
