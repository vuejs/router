import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import type { RouteComponent, RouteRecordRaw } from '../../types'
import { mockWarn } from '../../../__tests__/vitest-mock-warn'
import { createDynamicResolver } from './resolver-dynamic'
import { NO_MATCH_LOCATION } from './resolver-abstract'
import type { ResolverLocationResolved } from './resolver-abstract'
import type {
  EXPERIMENTAL_RouteRecordNormalized,
  EXPERIMENTAL_RouteRecordNormalized_Matchable,
} from '../router'

const component: RouteComponent = defineComponent({})
const components = { default: component }

type Loc =
  ResolverLocationResolved<EXPERIMENTAL_RouteRecordNormalized_Matchable>

function create(routes: RouteRecordRaw | RouteRecordRaw[]) {
  return createDynamicResolver(Array.isArray(routes) ? routes : [routes])
}

/**
 * Path built by the pattern of a record with some params.
 */
function recordPath(
  record: EXPERIMENTAL_RouteRecordNormalized | null | undefined,
  params: Loc['params'] = {}
) {
  return record?.path?.build(params)
}

/**
 * Paths built by each matched record with the params of the location.
 */
function matchedPaths(loc: Loc) {
  return loc.matched.map(r => recordPath(r, loc.params))
}

function aliasOfPaths(loc: Loc) {
  return loc.matched.map(r =>
    r.aliasOf ? recordPath(r.aliasOf, loc.params) : undefined
  )
}

function expectNoMatch(loc: Loc, path: string) {
  expect(loc.name).toBe(NO_MATCH_LOCATION.name)
  expect(loc.params).toEqual({})
  expect(loc.matched).toEqual([])
  expect(loc.path).toBe(path)
}

describe('createDynamicResolver resolve', () => {
  mockWarn()

  describe('static paths', () => {
    it('resolves a normal path', () => {
      const resolver = create({ path: '/', name: 'Home', components })
      const loc = resolver.resolve('/')
      expect(loc).toMatchObject({
        name: 'Home',
        path: '/',
        fullPath: '/',
        params: {},
        query: {},
        hash: '',
      })
      expect(matchedPaths(loc)).toEqual(['/'])
    })

    it('resolves a path object', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      const loc = resolver.resolve({ path: '/home' })
      expect(loc).toMatchObject({ name: 'Home', path: '/home', params: {} })
    })

    it('gives a symbol name to unnamed matchable records', () => {
      const resolver = create({ path: '/', components })
      const loc = resolver.resolve('/')
      expect(typeof loc.name).toBe('symbol')
      expect(loc.name).not.toBe(NO_MATCH_LOCATION.name)
      expect(loc.matched[0].name).toBe(loc.name)
      expect(resolver.getRoute(loc.name)).toBe(loc.matched[0])
    })

    it('gives a different symbol to each unnamed record', () => {
      const resolver = create([
        { path: '/a', components },
        { path: '/b', components },
      ])
      expect(resolver.resolve('/a').name).not.toBe(resolver.resolve('/b').name)
    })

    it('returns an empty match when the path does not exist', () => {
      const resolver = create({ path: '/', components })
      expectNoMatch(resolver.resolve('/foo'), '/foo')
      expectNoMatch(resolver.resolve({ path: '/foo' }), '/foo')
    })

    it('does not warn when adding new named routes', () => {
      create([
        { path: '/a', name: 'a', components },
        {
          path: '/b',
          name: 'b',
          components,
          children: [{ path: 'c', name: 'c', components }],
        },
      ])
      // mockWarn() fails the test on any warning
    })

    it('returns an empty match with no routes', () => {
      const resolver = createDynamicResolver()
      const loc = resolver.resolve('/foo?a=b#h')
      expectNoMatch(loc, '/foo')
      expect(loc.fullPath).toBe('/foo?a=b#h')
      expect(loc.query).toEqual({ a: ['b'] })
      expect(loc.hash).toBe('#h')
    })

    it('is strict about trailing slashes', () => {
      const resolver = create([
        { path: '/home/', name: 'Home', components },
        { path: '/about', name: 'About', components },
      ])
      expect(resolver.resolve('/home/')).toMatchObject({
        name: 'Home',
        path: '/home/',
      })
      expectNoMatch(resolver.resolve('/home'), '/home')
      expect(resolver.resolve('/about').name).toBe('About')
      expectNoMatch(resolver.resolve('/about/'), '/about/')
    })

    it('is case insensitive by default', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      expect(resolver.resolve('/HoMe')).toMatchObject({
        name: 'Home',
        path: '/HoMe',
      })
    })
  })

  describe('dynamic paths', () => {
    it('resolves a path with params', () => {
      const resolver = create({ path: '/users/:id', name: 'User', components })
      expect(resolver.resolve('/users/posva')).toMatchObject({
        name: 'User',
        path: '/users/posva',
        params: { id: 'posva' },
      })
    })

    it('resolves a path with multiple params', () => {
      const resolver = create({
        path: '/users/:id/:other',
        name: 'User',
        components,
      })
      expect(resolver.resolve('/users/posva/hey').params).toEqual({
        id: 'posva',
        other: 'hey',
      })
    })

    it('resolves a path with multiple params but no name', () => {
      const resolver = create({ path: '/users/:id/:other', components })
      const loc = resolver.resolve('/users/posva/hey')
      expect(typeof loc.name).toBe('symbol')
      expect(loc.params).toEqual({ id: 'posva', other: 'hey' })
    })

    it('is strict about trailing slashes with a param', () => {
      const resolver = create({ path: '/a/:a', components, name: 'a' })
      expect(resolver.resolve('/a/a').params).toEqual({ a: 'a' })
      expectNoMatch(resolver.resolve('/a/a/'), '/a/a/')
      const withSlash = create({ path: '/users/:id/', components, name: 'u' })
      expect(withSlash.resolve('/users/1/')).toMatchObject({
        name: 'u',
        params: { id: '1' },
      })
      expectNoMatch(withSlash.resolve('/users/1'), '/users/1')
      expect(withSlash.resolve({ name: 'u', params: { id: '1' } }).path).toBe(
        '/users/1/'
      )
    })

    it('does not match a missing required param', () => {
      const resolver = create({ path: '/users/:id', name: 'User', components })
      expectNoMatch(resolver.resolve('/users/'), '/users/')
    })

    it('supports params in the middle of a segment', () => {
      const resolver = create({
        path: '/file-:name.:ext',
        name: 'file',
        components,
      })
      expect(resolver.resolve('/file-readme.md').params).toEqual({
        name: 'readme',
        ext: 'md',
      })
    })
  })

  describe('custom regexps', () => {
    it('matches only if the regexp matches', () => {
      const resolver = create([
        { path: '/users/:id(\\d+)', name: 'by-id', components },
        { path: '/users/:slug', name: 'by-slug', components },
      ])
      expect(resolver.resolve('/users/123')).toMatchObject({
        name: 'by-id',
        params: { id: '123' },
      })
      expect(resolver.resolve('/users/posva')).toMatchObject({
        name: 'by-slug',
        params: { slug: 'posva' },
      })
    })

    it('does not rank a custom regexp above a plain param', () => {
      const resolver = create([
        { path: '/users/:slug', name: 'by-slug', components },
        { path: '/users/:id(\\d+)', name: 'by-id', components },
      ])
      // same score: the first added route wins
      expect(resolver.resolve('/users/123').name).toBe('by-slug')
    })

    it('ranks static paths above params', () => {
      const resolver = create([
        { path: '/users/:id', name: 'user', components },
        { path: '/users/new', name: 'new', components },
      ])
      expect(resolver.resolve('/users/new').name).toBe('new')
      expect(resolver.resolve('/users/other').name).toBe('user')
    })

    it('supports a custom regexp with a repeatable param', () => {
      const resolver = create({
        path: '/n/:nums(\\d+)+',
        name: 'n',
        components,
      })
      expect(resolver.resolve('/n/1/2/3').params).toEqual({
        nums: ['1', '2', '3'],
      })
      expectNoMatch(resolver.resolve('/n/1/a'), '/n/1/a')
    })
  })

  describe('optional params', () => {
    it('sets missing optional params to null', () => {
      const resolver = create({ path: '/:a?', components, name: 'a' })
      expect(resolver.resolve('/')).toMatchObject({
        name: 'a',
        path: '/',
        params: { a: null },
      })
      expect(resolver.resolve('/x').params).toEqual({ a: 'x' })
    })

    it('is strict about trailing slashes with a missing optional param', () => {
      const resolver = create({ path: '/a/:a?', components, name: 'a' })
      expect(resolver.resolve('/a')).toMatchObject({
        name: 'a',
        params: { a: null },
      })
      expectNoMatch(resolver.resolve('/a/'), '/a/')
    })

    it('resolves the root path with an optional param by name', () => {
      expect(
        create({ path: '/:tab?', name: 'h', components }).resolve({
          name: 'h',
          params: {},
        })
      ).toMatchObject({ name: 'h', path: '/', params: { tab: null } })
    })

    it('resolves the root path with many optional params by name', () => {
      const resolver = create({ path: '/:tab?/:other?', name: 'h', components })
      expect(resolver.resolve('/')).toMatchObject({
        name: 'h',
        params: { tab: null, other: null },
      })
      expect(resolver.resolve('/a')).toMatchObject({
        name: 'h',
        params: { tab: 'a', other: null },
      })
      expect(
        resolver.resolve({
          name: 'h',
          params: {},
        })
      ).toMatchObject({
        name: 'h',
        path: '/',
        params: { tab: null, other: null },
      })
    })

    it('normalizes empty optional params to null', () => {
      const resolver = create({
        path: '/features/:id?',
        name: 'features',
        components,
      })
      for (const id of ['', null, undefined]) {
        expect(
          resolver.resolve({ name: 'features', params: { id } })
        ).toMatchObject({
          name: 'features',
          path: '/features',
          params: { id: null },
        })
      }
      expect(
        'The optional path param "id" is being removed with an empty string'
      ).toHaveBeenWarnedTimes(1)
      expect(
        'The optional path param "id" is being removed with undefined'
      ).toHaveBeenWarnedTimes(1)
    })

    it('turns optional params passed as empty strings into null', () => {
      const resolver = create({ path: '/:a/:b?', name: 'p', components })
      expect(
        resolver.resolve({ name: 'p', params: { a: 'b', b: '' } })
      ).toMatchObject({ name: 'p', path: '/b', params: { a: 'b', b: null } })
      expect(
        'The optional path param "b" is being removed with an empty string'
      ).toHaveBeenWarned()
    })
  })

  describe('repeatable params', () => {
    it('resolves an array of params by name', () => {
      const resolver = create({ path: '/a/:p+', name: 'a', components })
      expect(
        resolver.resolve({ name: 'a', params: { p: ['b', 'c', 'd'] } })
      ).toMatchObject({
        name: 'a',
        path: '/a/b/c/d',
        params: { p: ['b', 'c', 'd'] },
      })
    })

    it('resolves a single param for a repeatable param as an array', () => {
      const resolver = create({ path: '/a/:p+', name: 'a', components })
      expect(resolver.resolve({ name: 'a', params: { p: 'b' } })).toMatchObject(
        { name: 'a', path: '/a/b', params: { p: ['b'] } }
      )
    })

    it('returns an array when matching a path', () => {
      const resolver = create({ path: '/a/:p+', name: 'a', components })
      expect(resolver.resolve('/a/b/c').params).toEqual({ p: ['b', 'c'] })
      expect(resolver.resolve('/a/b').params).toEqual({ p: ['b'] })
      expectNoMatch(resolver.resolve('/a'), '/a')
    })

    it('returns an empty array for a missing optional repeatable param', () => {
      const resolver = create({ path: '/a/:p*', name: 'a', components })
      expect(resolver.resolve('/a').params).toEqual({ p: [] })
      expect(resolver.resolve('/a/b/c').params).toEqual({ p: ['b', 'c'] })
      expect(resolver.resolve({ name: 'a', params: { p: [] } })).toMatchObject({
        path: '/a',
        params: { p: [] },
      })
    })
  })

  describe('catch-all', () => {
    const NotFound: RouteRecordRaw = {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      components,
    }

    it('matches any path', () => {
      const resolver = create([
        { path: '/', name: 'home', components },
        NotFound,
      ])
      expect(resolver.resolve('/').name).toBe('home')
      expect(resolver.resolve('/a/b/c')).toMatchObject({
        name: 'NotFound',
        params: { pathMatch: ['a', 'b', 'c'] },
      })
    })

    it('is ranked last regardless of order', () => {
      const resolver = create([
        NotFound,
        { path: '/users/:id', name: 'user', components },
      ])
      expect(resolver.resolve('/users/1').name).toBe('user')
      expect(resolver.resolve('/users/1/2').name).toBe('NotFound')
    })

    it('builds the path from an array by name', () => {
      const resolver = create(NotFound)
      expect(
        resolver.resolve({
          name: 'NotFound',
          params: { pathMatch: ['not', 'found'] },
        })
      ).toMatchObject({
        path: '/not/found',
        params: { pathMatch: ['not', 'found'] },
      })
    })

    it('uses an empty array for a missing optional splat', () => {
      const resolver = create({
        path: '/features/:pathMatch(.*)*',
        components,
        name: 'features',
      })
      expect(resolver.resolve('/features')).toMatchObject({
        name: 'features',
        params: { pathMatch: [] },
      })
      expect(resolver.resolve('/features/one')).toMatchObject({
        name: 'features',
        params: { pathMatch: ['one'] },
      })
    })

    it('throws with the removed "*" syntax', () => {
      expect(() => create({ path: '*', components })).toThrow(
        'Catch all routes ("*") must now be defined'
      )
    })
  })

  describe('strict, sensitive, end options', () => {
    // the options are ignored: paths are always strict, case insensitive, and
    // match until the end
    it('warns and stays strict with strict: false', () => {
      const resolver = create({
        path: '/home',
        name: 'Home',
        components,
        strict: false,
      })
      expect('VUE_ROUTER_R0131').toHaveBeenWarned()
      expect(resolver.resolve('/home').name).toBe('Home')
      expectNoMatch(resolver.resolve('/home/'), '/home/')
    })

    it('does not warn with strict: true', () => {
      const resolver = create({
        path: '/home',
        name: 'Home',
        components,
        strict: true,
      })
      expect('VUE_ROUTER_R0131').not.toHaveBeenWarned()
      expectNoMatch(resolver.resolve('/home/'), '/home/')
    })

    it('warns and stays case insensitive with sensitive: true', () => {
      const resolver = create({
        path: '/home',
        name: 'Home',
        components,
        sensitive: true,
      })
      expect('VUE_ROUTER_R0131').toHaveBeenWarned()
      expect(resolver.resolve('/HOME').name).toBe('Home')
    })

    it('warns and matches until the end with end: false', () => {
      const resolver = create({
        path: '/home',
        name: 'Home',
        components,
        end: false,
      })
      expect('VUE_ROUTER_R0131').toHaveBeenWarned()
      expect(resolver.resolve('/home').name).toBe('Home')
      expectNoMatch(resolver.resolve('/home/other'), '/home/other')
    })

    it('warns for children with the options', () => {
      create({
        path: '/parent',
        name: 'parent',
        components,
        children: [{ path: 'child', name: 'child', components, end: false }],
      })
      expect(
        'The route "child" uses the "strict", "sensitive", or "end" option'
      ).toHaveBeenWarned()
    })
  })

  describe('alias', () => {
    it('resolves an alias', () => {
      const resolver = create({
        path: '/',
        alias: '/home',
        name: 'Home',
        components,
        meta: { foo: true },
      })
      const loc = resolver.resolve('/home')
      expect(loc).toMatchObject({ name: 'Home', path: '/home', params: {} })
      expect(matchedPaths(loc)).toEqual(['/home'])
      expect(aliasOfPaths(loc)).toEqual(['/'])
      expect(loc.matched[0]).toMatchObject({
        name: 'Home',
        components,
        meta: { foo: true },
      })
      expect(loc.matched[0].aliasOf).toBe(resolver.getRoute('Home'))
    })

    it('resolves multiple aliases', () => {
      const resolver = create({
        path: '/',
        alias: ['/home', '/start'],
        name: 'Home',
        components,
        meta: { foo: true },
      })
      const root = resolver.resolve('/')
      expect(root.name).toBe('Home')
      expect(aliasOfPaths(root)).toEqual([undefined])

      for (const path of ['/home', '/start'] as const) {
        const loc = resolver.resolve(path)
        expect(loc).toMatchObject({ name: 'Home', path })
        expect(matchedPaths(loc)).toEqual([path])
        expect(aliasOfPaths(loc)).toEqual(['/'])
        expect(loc.matched[0].meta).toEqual({ foo: true })
        expect(loc.matched[0].components).toEqual(components)
      }
    })

    it('resolves the original record by name', () => {
      const resolver = create({
        path: '/',
        alias: '/home',
        name: 'Home',
        components,
      })
      const loc = resolver.resolve({ name: 'Home', params: {} })
      expect(loc).toMatchObject({ name: 'Home', path: '/', params: {} })
      expect(aliasOfPaths(loc)).toEqual([undefined])
    })

    it('does not add aliases to the name lookup', () => {
      const resolver = create({
        path: '/',
        alias: '/home',
        name: 'Home',
        components,
      })
      expect(resolver.getRoute('Home')!.aliasOf).toBeFalsy()
      expect(recordPath(resolver.getRoute('Home'))).toBe('/')
    })

    it('resolves an alias with params', () => {
      const resolver = create({
        path: '/users/:id',
        alias: '/u/:id',
        name: 'user',
        components,
      })
      expect(resolver.resolve('/u/1')).toMatchObject({
        name: 'user',
        path: '/u/1',
        params: { id: '1' },
      })
      expect(resolver.resolve({ name: 'user', params: { id: '1' } }).path).toBe(
        '/users/1'
      )
    })

    it('warns if the alias does not have the same params', () => {
      create({ path: '/users/:id', alias: '/u', name: 'user', components })
      expect(
        'Alias "/u" and the original record: "/users/:id" must have the exact same param named "id"'
      ).toHaveBeenWarned()
    })

    it('resolves an alias with children to the alias when using the path', () => {
      const resolver = create({
        path: '/parent',
        alias: '/p',
        component,
        children: [{ path: 'one', component, name: 'nested' }],
      })
      const loc = resolver.resolve('/p/one')
      expect(loc).toMatchObject({ name: 'nested', path: '/p/one', params: {} })
      expect(matchedPaths(loc)).toEqual(['/p', '/p/one'])
      expect(aliasOfPaths(loc)).toEqual(['/parent', '/parent/one'])
      expect(loc.matched.map(r => r.components)).toEqual([
        components,
        components,
      ])
    })

    it('resolves the original path of the named children of a route with an alias', () => {
      const resolver = create({
        path: '/parent',
        alias: '/p',
        component,
        children: [{ path: 'one', component, name: 'nested' }],
      })
      const loc = resolver.resolve({ name: 'nested', params: {} })
      expect(loc).toMatchObject({ name: 'nested', path: '/parent/one' })
      expect(matchedPaths(loc)).toEqual(['/parent', '/parent/one'])
      expect(aliasOfPaths(loc)).toEqual([undefined, undefined])
    })

    describe('nested aliases', () => {
      const record: RouteRecordRaw = {
        path: '/parent',
        name: 'parent',
        alias: '/p',
        component,
        children: [
          {
            path: 'one',
            component,
            name: 'nested',
            alias: 'o',
            children: [
              { path: 'two', alias: 't', name: 'nestednested', component },
            ],
          },
          {
            path: 'other',
            alias: 'otherAlias',
            component,
            name: 'other',
          },
        ],
      }

      function check(
        path: `/${string}`,
        name: string,
        paths: string[],
        aliases: Array<string | undefined>
      ) {
        const loc = create(record).resolve(path)
        expect(loc.name).toBe(name)
        expect(loc.path).toBe(path)
        expect(matchedPaths(loc)).toEqual(paths)
        expect(aliasOfPaths(loc)).toEqual(aliases)
      }

      it('resolves the parent as an alias', () => {
        check('/p', 'parent', ['/p'], ['/parent'])
      })

      it('resolves the alias parent of a child', () => {
        check(
          '/p/other',
          'other',
          ['/p', '/p/other'],
          ['/parent', '/parent/other']
        )
      })

      it('resolves the alias child', () => {
        check(
          '/parent/otherAlias',
          'other',
          ['/parent', '/parent/otherAlias'],
          [undefined, '/parent/other']
        )
      })

      it('resolves the alias parent and child', () => {
        check(
          '/p/otherAlias',
          'other',
          ['/p', '/p/otherAlias'],
          ['/parent', '/parent/other']
        )
      })

      it('resolves the original one with no aliases', () => {
        check(
          '/parent/one/two',
          'nestednested',
          ['/parent', '/parent/one', '/parent/one/two'],
          [undefined, undefined, undefined]
        )
      })

      it('resolves when parent is an alias', () => {
        check(
          '/p/one/two',
          'nestednested',
          ['/p', '/p/one', '/p/one/two'],
          ['/parent', '/parent/one', '/parent/one/two']
        )
      })

      it('resolves when the first child is an alias', () => {
        check(
          '/parent/o/two',
          'nestednested',
          ['/parent', '/parent/o', '/parent/o/two'],
          [undefined, '/parent/one', '/parent/one/two']
        )
      })

      it('resolves when the second child is an alias', () => {
        check(
          '/parent/one/t',
          'nestednested',
          ['/parent', '/parent/one', '/parent/one/t'],
          [undefined, undefined, '/parent/one/two']
        )
      })

      it('resolves when the two last children are aliases', () => {
        check(
          '/parent/o/t',
          'nestednested',
          ['/parent', '/parent/o', '/parent/o/t'],
          [undefined, '/parent/one', '/parent/one/two']
        )
      })

      it('resolves when all are aliases', () => {
        check(
          '/p/o/t',
          'nestednested',
          ['/p', '/p/o', '/p/o/t'],
          ['/parent', '/parent/one', '/parent/one/two']
        )
      })

      it('resolves when first and last are aliases', () => {
        check(
          '/p/one/t',
          'nestednested',
          ['/p', '/p/one', '/p/one/t'],
          ['/parent', '/parent/one', '/parent/one/two']
        )
      })

      it('resolves the original path by name', () => {
        const resolver = create(record)
        expect(
          resolver.resolve({ name: 'nestednested', params: {} }).path
        ).toBe('/parent/one/two')
        expect(resolver.resolve({ name: 'other', params: {} }).path).toBe(
          '/parent/other'
        )
      })

      it.todo('resolves when parent is an alias and child has an absolute path')
    })
  })

  describe('LocationAsName', () => {
    it('matches a name', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      expect(resolver.resolve({ name: 'Home', params: {} })).toMatchObject({
        name: 'Home',
        path: '/home',
        fullPath: '/home',
        params: {},
      })
    })

    it('matches a name and fills params', () => {
      const resolver = create({
        path: '/users/:id/m/:role',
        name: 'UserEdit',
        components,
      })
      expect(
        resolver.resolve({
          name: 'UserEdit',
          params: { id: 'posva', role: 'admin' },
        })
      ).toMatchObject({
        name: 'UserEdit',
        path: '/users/posva/m/admin',
        params: { id: 'posva', role: 'admin' },
      })
    })

    it('allows numbers as params', () => {
      const resolver = create([
        { path: '/users/:id', name: 'user', components },
        { path: '/a/:p+', name: 'a', components },
      ])
      expect(
        resolver.resolve({ name: 'user', params: { id: 1 } })
      ).toMatchObject({ path: '/users/1', params: { id: '1' } })
      expect(
        resolver.resolve({ name: 'a', params: { p: [1, 2] } })
      ).toMatchObject({ path: '/a/1/2', params: { p: ['1', '2'] } })
    })

    it('throws if the named route does not exist', () => {
      const resolver = create({ path: '/', components })
      expect(() => resolver.resolve({ name: 'Home', params: {} })).toThrow(
        'Record "Home" not found'
      )
    })

    it('throws if a required param is missing', () => {
      const resolver = create({ path: '/users/:id', name: 'user', components })
      expect(() => resolver.resolve({ name: 'user', params: {} })).toThrow()
      expect('Missing required param "id"').toHaveBeenWarned()
    })

    it('merges params from the current location', () => {
      const resolver = create({ path: '/:a/:b', name: 'p', components })
      const current = resolver.resolve('/a/x')
      expect(
        resolver.resolve({ name: 'p', params: { b: 'b' } }, current)
      ).toMatchObject({ name: 'p', path: '/a/b', params: { a: 'a', b: 'b' } })
    })

    it('only keeps existing params', () => {
      const resolver = create([
        { path: '/:a/:b', name: 'p', components },
        { path: '/:a/:c/x', name: 'other', components },
      ])
      const current = resolver.resolve('/a/c/x')
      expect(current.params).toEqual({ a: 'a', c: 'c' })
      expect(
        resolver.resolve({ name: 'p', params: { b: 'b' } }, current)
      ).toMatchObject({ name: 'p', path: '/a/b', params: { a: 'a', b: 'b' } })
    })

    it('keeps optional params from the parent record', () => {
      const resolver = create({
        path: '/:optional?/parent',
        name: 'parent',
        components,
        children: [
          { path: 'a', name: 'child_a', components },
          { path: 'b', name: 'child_b', components },
        ],
      })
      const current = resolver.resolve('/foo/parent/a')
      const loc = resolver.resolve({ name: 'child_b', params: {} }, current)
      expect(loc).toMatchObject({
        name: 'child_b',
        path: '/foo/parent/b',
        params: { optional: 'foo' },
      })
      expect(matchedPaths(loc)).toEqual(['/foo/parent', '/foo/parent/b'])
    })

    it('warns about missing required params', () => {
      const resolver = create([
        { path: '/u/:id/:tab?', name: 'user', components },
        { path: '/f/:path+', name: 'files', components },
      ])
      expect(() => resolver.resolve({ name: 'user', params: {} })).toThrow()
      expect('Missing required param "id"').toHaveBeenWarned()
      expect(() =>
        resolver.resolve({ name: 'files', params: { path: [] } })
      ).toThrow()
      expect('Missing required param "path"').toHaveBeenWarned()
    })

    it('does not warn about missing optional params', () => {
      const resolver = create({
        path: '/u/:id/:tab?',
        name: 'user',
        components,
      })
      resolver.resolve({ name: 'user', params: { id: '1' } })
      expect('Missing required param').not.toHaveBeenWarned()
    })

    it('discards non existent params with a warning', () => {
      const resolver = create([
        { path: '/', name: 'home', components },
        { path: '/:b', name: 'a', components },
      ])
      expect(
        resolver.resolve({ name: 'home', params: { a: 'a', b: 'b' } })
      ).toMatchObject({ name: 'home', path: '/', params: {} })
      expect(
        resolver.resolve({ name: 'a', params: { a: 'a', b: 'b' } })
      ).toMatchObject({ name: 'a', path: '/b', params: { b: 'b' } })
      expect('invalid param(s) "a", "b"').toHaveBeenWarned()
      expect('invalid param(s) "a"').toHaveBeenWarnedTimes(2)
    })

    it('does not warn for params of the record and its parents', () => {
      const resolver = create({
        path: '/u/:id',
        name: 'user',
        components,
        children: [{ path: ':tab?', name: 'tab', components }],
      })
      resolver.resolve({ name: 'tab', params: { id: '1', tab: null } })
      expect('invalid param').not.toHaveBeenWarned()
    })

    // classic drops the optional params of the current location that belong
    // to the target record itself (only parent optional params are kept)
    it.todo('drops optional params of the current location')

    it('drops optional params when explicitly passed as null', () => {
      const resolver = create({ path: '/:a/:b?', name: 'p', components })
      const current = resolver.resolve('/a/b')
      expect(
        resolver.resolve({ name: 'p', params: { a: 'b', b: null } }, current)
      ).toMatchObject({ name: 'p', path: '/b', params: { a: 'b', b: null } })
    })

    it('can reach a named route with children and no component', () => {
      const resolver = create({
        path: '/articles',
        name: 'ArticlesParent',
        children: [{ path: ':id', components }],
      })
      const loc = resolver.resolve({ name: 'ArticlesParent', params: {} })
      expect(loc).toMatchObject({ name: 'ArticlesParent', path: '/articles' })
      expect(matchedPaths(loc)).toEqual(['/articles'])
    })

    it('adds query and hash', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      expect(
        resolver.resolve({
          name: 'Home',
          params: {},
          query: { a: ['1', '2'], b: ['x'] },
          hash: '#top',
        })
      ).toMatchObject({
        path: '/home',
        fullPath: '/home?a=1&a=2&b=x#top',
        query: { a: ['1', '2'], b: ['x'] },
        hash: '#top',
      })
    })
  })

  describe('LocationAsRelative', () => {
    it('resolves a relative path against the current location', () => {
      const resolver = create([
        { path: '/parent/one', name: 'one', components },
        { path: '/parent/two', name: 'two', components },
      ])
      const current = resolver.resolve('/parent/one')
      expect(resolver.resolve({ path: 'two' }, current)).toMatchObject({
        name: 'two',
        path: '/parent/two',
      })
      expect(resolver.resolve('two', current)).toMatchObject({
        name: 'two',
        path: '/parent/two',
      })
      expect(resolver.resolve('./two', current).path).toBe('/parent/two')
    })

    it('resolves a query only string against the current location', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      const current = resolver.resolve('/home')
      expect(resolver.resolve('?page=2', current)).toMatchObject({
        name: 'Home',
        path: '/home',
        fullPath: '/home?page=2',
        query: { page: ['2'] },
      })
    })

    it('matches with nothing', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      const current = resolver.resolve('/home')
      expect(resolver.resolve({}, current)).toMatchObject({
        name: 'Home',
        path: '/home',
      })
    })

    it('replaces params even with no name', () => {
      const resolver = create({ path: '/users/:id/m/:role', components })
      const current = resolver.resolve('/users/ed/m/user')
      const loc = resolver.resolve(
        { params: { id: 'posva', role: 'admin' } },
        current
      )
      expect(loc).toMatchObject({
        name: current.name,
        path: '/users/posva/m/admin',
        params: { id: 'posva', role: 'admin' },
      })
    })

    it('replaces params', () => {
      const resolver = create({
        path: '/users/:id/m/:role',
        name: 'UserEdit',
        components,
      })
      const current = resolver.resolve('/users/ed/m/user')
      expect(
        resolver.resolve({ params: { id: 'posva', role: 'admin' } }, current)
      ).toMatchObject({
        name: 'UserEdit',
        path: '/users/posva/m/admin',
        params: { id: 'posva', role: 'admin' },
      })
    })

    it('keeps params if not provided', () => {
      const resolver = create({
        path: '/users/:id/m/:role',
        name: 'UserEdit',
        components,
      })
      const current = resolver.resolve('/users/ed/m/user')
      expect(resolver.resolve({}, current)).toMatchObject({
        name: 'UserEdit',
        path: '/users/ed/m/user',
        params: { id: 'ed', role: 'user' },
      })
    })

    it('keeps params if not provided even with no name', () => {
      const resolver = create({ path: '/users/:id/m/:role', components })
      const current = resolver.resolve('/users/ed/m/user')
      expect(resolver.resolve({}, current)).toMatchObject({
        name: current.name,
        path: '/users/ed/m/user',
        params: { id: 'ed', role: 'user' },
      })
    })

    it('merges params', () => {
      const resolver = create({ path: '/:a/:b?', name: 'p', components })
      const current = resolver.resolve('/a')
      expect(current.params).toEqual({ a: 'a', b: null })
      expect(resolver.resolve({ params: { b: 'b' } }, current)).toMatchObject({
        name: 'p',
        path: '/a/b',
        params: { a: 'a', b: 'b' },
      })
    })

    it('keeps optional params', () => {
      const resolver = create({ path: '/:a/:b?', name: 'p', components })
      const current = resolver.resolve('/a/b')
      expect(resolver.resolve({}, current)).toMatchObject({
        name: 'p',
        path: '/a/b',
        params: { a: 'a', b: 'b' },
      })
    })

    it('merges optional params', () => {
      const resolver = create({ path: '/:a/:b?', name: 'p', components })
      const current = resolver.resolve('/a/b')
      expect(resolver.resolve({ params: { a: 'c' } }, current)).toMatchObject({
        name: 'p',
        path: '/c/b',
        params: { a: 'c', b: 'b' },
      })
    })

    it('keeps the query and hash of the current location', () => {
      const resolver = create({ path: '/:a', name: 'p', components })
      const current = resolver.resolve('/a?q=1#h')
      expect(resolver.resolve({ params: { a: 'b' } }, current)).toMatchObject({
        path: '/b',
        fullPath: '/b?q=1#h',
        query: { q: ['1'] },
        hash: '#h',
      })
    })

    it('throws if the current named route does not exist', () => {
      const resolver = create({ path: '/', components })
      const current = resolver.resolve('/')
      expect(() =>
        resolver.resolve({ params: { a: 'foo' } }, { ...current, name: 'home' })
      ).toThrow('Record "home" not found')
    })

    it('warns without a current location', () => {
      const resolver = create({ path: '/', components })
      const loc = resolver.resolve({ params: {} } as any)
      expect(loc.name).toBe(NO_MATCH_LOCATION.name)
      expect(
        'Cannot resolve relative location "{"params":{}}"without a "name" or a current location'
      ).toHaveBeenWarned()
    })

    it('avoids records with children without a component nor name', () => {
      const resolver = create({
        path: '/articles',
        children: [{ path: ':id', components }],
      })
      expectNoMatch(resolver.resolve('/articles'), '/articles')
      expect(matchedPaths(resolver.resolve('/articles/1'))).toEqual([
        '/articles',
        '/articles/1',
      ])
    })

    it('avoids deeply nested records with children without a component nor name', () => {
      const resolver = create({
        path: '/app',
        components,
        children: [
          {
            path: '/articles',
            children: [{ path: ':id', components }],
          },
        ],
      })
      expectNoMatch(resolver.resolve('/articles'), '/articles')
      expect(matchedPaths(resolver.resolve('/articles/2'))).toEqual([
        '/app',
        '/articles',
        '/articles/2',
      ])
    })
  })

  describe('children', () => {
    const ChildA = { path: 'a', name: 'child-a', components }
    const ChildB = { path: 'b', name: 'child-b', components }
    const ChildC = { path: 'c', name: 'child-c', components }
    const ChildD = { path: '/absolute', name: 'absolute', components }
    const ChildWithParam = { path: ':p', name: 'child-params', components }
    const Nested: RouteRecordRaw = {
      path: 'nested',
      name: 'nested',
      components,
      children: [
        { ...ChildA, name: 'nested-child-a' },
        { ...ChildB, name: 'nested-child-b' },
        { ...ChildC, name: 'nested-child-c' },
      ],
    }
    const NestedWithParam: RouteRecordRaw = {
      path: 'nested/:n',
      name: 'nested',
      components,
      children: [{ ...ChildWithParam, name: 'nested-child-params' }],
    }

    it('resolves children', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [ChildA, ChildB, ChildC],
      })
      const loc = resolver.resolve('/foo/b')
      expect(loc).toMatchObject({ name: 'child-b', path: '/foo/b', params: {} })
      expect(matchedPaths(loc)).toEqual(['/foo', '/foo/b'])
      expect(loc.matched.map(r => r.name)).toEqual(['Foo', 'child-b'])
    })

    it('sets the parent of matched records', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [ChildA],
      })
      const [parent, child] = resolver.resolve('/foo/a').matched
      expect(child.parent).toBe(parent)
      expect(parent.parent).toBeUndefined()
    })

    it('resolves children with empty paths', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [{ path: '', name: 'nested', components }],
      })
      const loc = resolver.resolve('/foo')
      expect(loc).toMatchObject({ name: 'nested', path: '/foo', params: {} })
      expect(matchedPaths(loc)).toEqual(['/foo', '/foo'])
    })

    it('resolves the parent by name with an empty path child', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [{ path: '', name: 'nested', components }],
      })
      const loc = resolver.resolve({ name: 'Foo', params: {} })
      expect(loc.name).toBe('Foo')
      expect(matchedPaths(loc)).toEqual(['/foo'])
    })

    it('resolves nested children with empty paths', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [
          {
            path: '',
            name: 'nested-nested',
            components,
            children: [{ path: '', name: 'nested', components }],
          },
        ],
      })
      const loc = resolver.resolve('/foo')
      expect(loc).toMatchObject({ name: 'nested', path: '/foo', params: {} })
      expect(matchedPaths(loc)).toEqual(['/foo', '/foo', '/foo'])
    })

    it('warns about a named parent with an unnamed empty path child', () => {
      create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [{ path: '', components }],
      })
      expect(
        'The route named "Foo" has a child without a name, an empty path, and no children'
      ).toHaveBeenWarned()
    })

    it('resolves nested children', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      })
      const loc = resolver.resolve('/foo/nested/a')
      expect(loc).toMatchObject({
        name: 'nested-child-a',
        path: '/foo/nested/a',
        params: {},
      })
      expect(matchedPaths(loc)).toEqual([
        '/foo',
        '/foo/nested',
        '/foo/nested/a',
      ])
    })

    it('resolves nested children with a named location', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      })
      const loc = resolver.resolve({ name: 'nested-child-a', params: {} })
      expect(loc).toMatchObject({
        name: 'nested-child-a',
        path: '/foo/nested/a',
      })
      expect(matchedPaths(loc)).toEqual([
        '/foo',
        '/foo/nested',
        '/foo/nested/a',
      ])
    })

    it('resolves nested children with a relative location', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      })
      const current = resolver.resolve('/foo/nested/a')
      const loc = resolver.resolve({}, current)
      expect(loc).toMatchObject({
        name: 'nested-child-a',
        path: '/foo/nested/a',
      })
      expect(matchedPaths(loc)).toEqual([
        '/foo',
        '/foo/nested',
        '/foo/nested/a',
      ])
    })

    it('resolves nested children with params', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [NestedWithParam],
      })
      const loc = resolver.resolve('/foo/nested/a/b')
      expect(loc).toMatchObject({
        name: 'nested-child-params',
        params: { p: 'b', n: 'a' },
      })
      expect(matchedPaths(loc)).toEqual([
        '/foo',
        '/foo/nested/a',
        '/foo/nested/a/b',
      ])
    })

    it('resolves nested children with params with a named location', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [NestedWithParam],
      })
      expect(
        resolver.resolve({
          name: 'nested-child-params',
          params: { p: 'a', n: 'b' },
        })
      ).toMatchObject({
        name: 'nested-child-params',
        path: '/foo/nested/b/a',
        params: { p: 'a', n: 'b' },
      })
    })

    it('resolves absolute path children', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [ChildA, ChildD],
      })
      const loc = resolver.resolve('/absolute')
      expect(loc).toMatchObject({ name: 'absolute', path: '/absolute' })
      expect(matchedPaths(loc)).toEqual(['/foo', '/absolute'])
      expectNoMatch(resolver.resolve('/foo/absolute'), '/foo/absolute')
    })

    it('warns if an absolute child misses a param of the parent', () => {
      create({
        path: '/foo/:id',
        name: 'Foo',
        components,
        children: [ChildD],
      })
      expect(
        'Absolute path "/absolute" must have the exact same param named "id" as its parent "/foo/:id".'
      ).toHaveBeenWarned()
    })

    it('resolves children with root as the parent', () => {
      const resolver = create({
        path: '/',
        name: 'parent',
        components,
        children: [{ path: 'nested', name: 'nested', components }],
      })
      const loc = resolver.resolve('/nested')
      expect(loc.name).toBe('nested')
      expect(matchedPaths(loc)).toEqual(['/', '/nested'])
    })

    it('resolves children with a parent with a trailing slash', () => {
      const resolver = create({
        path: '/parent/',
        name: 'parent',
        components,
        children: [{ path: 'nested', name: 'nested', components }],
      })
      const loc = resolver.resolve('/parent/nested')
      expect(loc.name).toBe('nested')
      expect(matchedPaths(loc)).toEqual(['/parent/', '/parent/nested'])
    })

    it('ranks a child before its parent with the same score', () => {
      const resolver = create({
        path: '/foo',
        name: 'Foo',
        components,
        children: [{ path: '', name: 'index', components }],
      })
      expect(resolver.resolve('/foo').name).toBe('index')
    })
  })

  describe('meta', () => {
    it('exposes the meta of each record in matched', () => {
      const resolver = create({
        path: '/parent',
        meta: { a: 1, shared: 'parent' },
        components,
        children: [
          {
            path: 'child',
            name: 'child',
            meta: { b: 2, shared: 'child' },
            components,
          },
        ],
      })
      const loc = resolver.resolve('/parent/child')
      expect(loc.matched.map(r => r.meta)).toEqual([
        { a: 1, shared: 'parent' },
        { b: 2, shared: 'child' },
      ])
      // what the router merges into `route.meta`
      expect(Object.assign({}, ...loc.matched.map(r => r.meta))).toEqual({
        a: 1,
        b: 2,
        shared: 'child',
      })
    })

    it('defaults meta to an empty object', () => {
      const resolver = create({ path: '/', name: 'home', components })
      expect(resolver.resolve('/').matched[0].meta).toEqual({})
    })

    it('keeps the meta of group records', () => {
      const resolver = create({
        path: '/group',
        meta: { group: true },
        children: [{ path: 'a', name: 'a', components }],
      })
      expect(resolver.resolve('/group/a').matched.map(r => r.meta)).toEqual([
        { group: true },
        {},
      ])
    })
  })

  describe('components and props', () => {
    const Other = defineComponent({})

    it('transforms a single view into a default named view', () => {
      const resolver = create({ path: '/home', name: 'home', component })
      const [record] = resolver.resolve('/home').matched
      expect(record.components).toEqual({ default: component })
      expect(record.props).toEqual({ default: false })
    })

    it('keeps multiple views', () => {
      const resolver = create({
        path: '/home',
        name: 'home',
        components: { default: component, other: Other },
      })
      const [record] = resolver.resolve('/home').matched
      expect(record.components).toEqual({ default: component, other: Other })
      expect(record.props).toEqual({ default: false, other: false })
    })

    it('normalizes props: true', () => {
      const resolver = create([
        { path: '/a', name: 'a', component, props: true },
        {
          path: '/b',
          name: 'b',
          components: { default: component, other: Other },
          props: true,
        },
      ])
      expect(resolver.resolve('/a').matched[0].props).toEqual({
        default: true,
      })
      expect(resolver.resolve('/b').matched[0].props).toEqual({
        default: true,
        other: true,
      })
    })

    it('normalizes props as an object and a function', () => {
      const fn = () => ({ a: 1 })
      const resolver = create([
        { path: '/obj', name: 'obj', component, props: { a: 1 } },
        { path: '/fn', name: 'fn', component, props: fn },
      ])
      expect(resolver.resolve('/obj').matched[0].props).toEqual({
        default: { a: 1 },
      })
      expect(resolver.resolve('/fn').matched[0].props).toEqual({
        default: fn,
      })
    })

    it('normalizes props per named view', () => {
      const fn = () => ({})
      const resolver = create({
        path: '/home',
        name: 'home',
        components: { default: component, other: Other, third: Other },
        props: { default: true, other: fn },
      })
      expect(resolver.resolve('/home').matched[0].props).toEqual({
        default: true,
        other: fn,
        third: undefined,
      })
    })

    it('shares components and props with aliases', () => {
      const resolver = create({
        path: '/home',
        alias: '/h',
        name: 'home',
        component,
        props: true,
      })
      const [record] = resolver.resolve('/h').matched
      expect(record.aliasOf).toBeTruthy()
      expect(record.components).toEqual({ default: component })
      expect(record.props).toEqual({ default: true })
    })

    it('keeps the redirect of a record', () => {
      const resolver = create([
        {
          path: '/redirect',
          name: 'r',
          redirect: '/home',
          meta: { foo: true },
        },
        { path: '/home', name: 'home', component },
      ])
      const loc = resolver.resolve('/redirect')
      expect(loc.name).toBe('r')
      expect(loc.matched[0]).toMatchObject({
        name: 'r',
        redirect: '/home',
        meta: { foo: true },
      })
    })

    it('matches an unnamed redirect record', () => {
      const resolver = create({ path: '/redirect', redirect: '/home' })
      const loc = resolver.resolve('/redirect')
      expect(typeof loc.name).toBe('symbol')
      expect(loc.matched[0].redirect).toBe('/home')
    })

    it('keeps beforeEnter and warns about its deprecation', () => {
      const beforeEnter = () => {}
      const resolver = create({
        path: '/home',
        name: 'home',
        component,
        beforeEnter,
      })
      // beforeEnter is deprecated and not part of the experimental record type
      const [record] = resolver.resolve('/home').matched as Array<{
        beforeEnter?: unknown
      }>
      expect(record.beforeEnter).toBe(beforeEnter)
      expect('Route "home" uses beforeEnter').toHaveBeenWarned()
    })
  })

  describe('encoding', () => {
    it('decodes params when matching', () => {
      const resolver = create({ path: '/users/:id', name: 'user', components })
      expect(resolver.resolve('/users/a%20b%2Fc').params).toEqual({
        id: 'a b/c',
      })
    })

    it('decodes repeatable params when matching', () => {
      const resolver = create({ path: '/a/:p+', name: 'a', components })
      expect(resolver.resolve('/a/%C3%A9/a%20b').params).toEqual({
        p: ['é', 'a b'],
      })
    })

    it('encodes params when building', () => {
      const resolver = create({ path: '/users/:id', name: 'user', components })
      const loc = resolver.resolve({ name: 'user', params: { id: 'a b/c?#' } })
      expect(loc.path).toBe('/users/a%20b%2Fc%3F%23')
      expect(loc.fullPath).toBe('/users/a%20b%2Fc%3F%23')
      // decoded again after matching
      expect(loc.params).toEqual({ id: 'a b/c?#' })
    })

    it('encodes repeatable params separately', () => {
      const resolver = create({ path: '/a/:p+', name: 'a', components })
      const loc = resolver.resolve({
        name: 'a',
        params: { p: ['a/b', 'c d'] },
      })
      expect(loc.path).toBe('/a/a%2Fb/c%20d')
      expect(loc.params).toEqual({ p: ['a/b', 'c d'] })
    })

    it('round trips unicode characters', () => {
      const resolver = create({ path: '/:p', name: 'p', components })
      const loc = resolver.resolve({ name: 'p', params: { p: 'é' } })
      expect(loc.path).toBe('/%C3%A9')
      expect(resolver.resolve(loc.fullPath as `/${string}`).params).toEqual({
        p: 'é',
      })
    })

    // like the classic matcher, static segments are compared to the raw path
    it('matches static segments literally', () => {
      const resolver = create([
        { path: '/a%20b', name: 'encoded', components },
        { path: '/c d', name: 'raw', components },
      ])
      expect(resolver.resolve('/a%20b').name).toBe('encoded')
      expect(resolver.resolve('/c d').name).toBe('raw')
      expectNoMatch(resolver.resolve('/c%20d'), '/c%20d')
      expect(resolver.resolve({ name: 'encoded', params: {} }).path).toBe(
        '/a%20b'
      )
    })

    it('encodes the hash and query when resolving by name', () => {
      const resolver = create({ path: '/', name: 'home', components })
      const loc = resolver.resolve({
        name: 'home',
        params: {},
        query: { q: ['a b&c'] },
        hash: '#a b',
      })
      expect(loc.fullPath).toBe('/?q=a+b%26c#a%20b')
      expect(loc.query).toEqual({ q: ['a b&c'] })
      expect(loc.hash).toBe('#a%20b')
    })
  })

  describe('query and hash', () => {
    it('parses query values as arrays', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      const loc = resolver.resolve('/home?a=1&b=2&a=3&c#top')
      expect(loc).toMatchObject({
        name: 'Home',
        path: '/home',
        fullPath: '/home?a=1&b=2&a=3&c#top',
        query: { a: ['1', '3'], b: ['2'], c: [null] },
        hash: '#top',
      })
    })

    it('decodes the query of a string', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      expect(resolver.resolve('/home?q=a+b%26c&%C3%A9=1').query).toEqual({
        q: ['a b&c'],
        é: ['1'],
      })
    })

    it('normalizes the query and hash of a path object', () => {
      const resolver = create({ path: '/home', name: 'Home', components })
      const loc = resolver.resolve({
        path: '/home',
        query: { a: ['1'], n: [null] },
        hash: '#h',
      })
      expect(loc).toMatchObject({
        name: 'Home',
        fullPath: '/home?a=1&n#h',
        hash: '#h',
      })
      expect(loc.query.a).toEqual(['1'])
    })

    it('keeps the query and hash on a no match', () => {
      const resolver = create({ path: '/', name: 'home', components })
      const loc = resolver.resolve('/nope?a=b#c')
      expectNoMatch(loc, '/nope')
      expect(loc.query).toEqual({ a: ['b'] })
      expect(loc.hash).toBe('#c')
    })
  })
})
