import { describe, expect, it } from 'vitest'
import { createFixedResolver } from './resolver-fixed'
import { NO_MATCH_LOCATION } from './resolver-abstract'
import { MatcherQueryParams } from './matchers/matcher-pattern'
import {
  MatcherPatternQuery,
  MatcherPatternPathStatic,
} from './matchers/matcher-pattern'
import {
  EMPTY_PATH_PATTERN_MATCHER,
  USER_ID_PATH_PATTERN_MATCHER,
  ANY_PATH_PATTERN_MATCHER,
  ANY_HASH_PATTERN_MATCHER,
  PAGE_QUERY_PATTERN_MATCHER,
} from './matchers/test-utils'
import { miss } from './matchers/errors'
import { MatcherPatternPath } from './matchers/matcher-pattern'

// Additional pattern matchers for testing advanced scenarios
const USERS_ID_OTHER_PATH_MATCHER: MatcherPatternPath<{
  id: string
  other: string
}> = {
  match(path) {
    const match = path.match(/^\/users\/([^/]+)\/([^/]+)$/)
    if (!match) throw miss()
    return { id: match[1], other: match[2] }
  },
  build({ id, other }) {
    return `/users/${id}/${other}`
  },
}

const AB_PARAMS_PATH_MATCHER: MatcherPatternPath<{ a: string; b: string }> = {
  match(path) {
    const match = path.match(/^\/([^/]+)\/([^/]+)$/)
    if (!match) throw miss()
    return { a: match[1], b: match[2] }
  },
  build({ a, b }) {
    return `/${a}/${b}`
  },
}

const AB_OPTIONAL_PATH_MATCHER: MatcherPatternPath<{ a: string; b?: string }> =
  {
    match(path) {
      const match = path.match(/^\/([^/]+)(?:\/([^/]+))?$/)
      if (!match) throw miss()
      return { a: match[1], b: match[2] || '' }
    },
    build({ a, b }) {
      return b ? `/${a}/${b}` : `/${a}`
    },
  }

const REPEATABLE_PARAM_MATCHER: MatcherPatternPath<{ p: string | string[] }> = {
  match(path) {
    const match = path.match(/^\/a\/(.+)$/)
    if (!match) throw miss()
    const segments = match[1].split('/')
    return { p: segments.length === 1 ? segments[0] : segments }
  },
  build({ p }) {
    const segments = Array.isArray(p) ? p : [p]
    return `/a/${segments.join('/')}`
  },
}

describe('fixed resolver', () => {
  describe('new matchers', () => {
    it('static path', () => {
      const resolver = createFixedResolver([
        { name: 'root', path: new MatcherPatternPathStatic('/') },
        { name: 'users', path: new MatcherPatternPathStatic('/users') },
      ])

      expect(resolver.resolve({ path: '/' })).toMatchObject({
        fullPath: '/',
        path: '/',
        params: {},
        query: {},
        hash: '',
      })

      expect(resolver.resolve({ path: '/users' })).toMatchObject({
        fullPath: '/users',
        path: '/users',
        params: {},
        query: {},
        hash: '',
      })
    })

    it('dynamic path', () => {
      const resolver = createFixedResolver([
        {
          name: 'user-detail',
          path: USER_ID_PATH_PATTERN_MATCHER,
        },
      ])

      expect(resolver.resolve({ path: '/users/1' })).toMatchObject({
        fullPath: '/users/1',
        path: '/users/1',
        params: { id: 1 },
      })
    })
  })

  describe('resolve()', () => {
    describe('absolute locations as strings', () => {
      it('resolves string locations with no params', () => {
        const resolver = createFixedResolver([
          { name: 'root', path: EMPTY_PATH_PATTERN_MATCHER },
        ])

        expect(resolver.resolve('/?a=a&b=b#h')).toMatchObject({
          path: '/',
          params: {},
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolves a not found string', () => {
        const resolver = createFixedResolver([])
        expect(resolver.resolve('/bar?q=1#hash')).toEqual({
          ...NO_MATCH_LOCATION,
          fullPath: '/bar?q=1#hash',
          path: '/bar',
          query: { q: '1' },
          hash: '#hash',
          matched: [],
        })
      })

      it('resolves string locations with params', () => {
        const resolver = createFixedResolver([
          { name: 'user-detail', path: USER_ID_PATH_PATTERN_MATCHER },
        ])

        expect(resolver.resolve('/users/1?a=a&b=b#h')).toMatchObject({
          path: '/users/1',
          params: { id: 1 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
        expect(resolver.resolve('/users/54?a=a&b=b#h')).toMatchObject({
          path: '/users/54',
          params: { id: 54 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolve string locations with query', () => {
        const resolver = createFixedResolver([
          {
            name: 'any-path',
            path: ANY_PATH_PATTERN_MATCHER,
            query: [PAGE_QUERY_PATTERN_MATCHER],
          },
        ])

        expect(resolver.resolve('/foo?page=100&b=b#h')).toMatchObject({
          params: { page: 100 },
          path: '/foo',
          query: {
            page: '100',
            b: 'b',
          },
          hash: '#h',
        })
      })

      it('resolves string locations with hash', () => {
        const resolver = createFixedResolver([
          {
            name: 'any-path',
            path: ANY_PATH_PATTERN_MATCHER,
            hash: ANY_HASH_PATTERN_MATCHER,
          },
        ])

        expect(resolver.resolve('/foo?a=a&b=b#bar')).toMatchObject({
          hash: '#bar',
          params: { hash: 'bar' },
          path: '/foo',
          query: { a: 'a', b: 'b' },
        })
      })

      it('combines path, query and hash params', () => {
        const resolver = createFixedResolver([
          {
            name: 'user-detail',
            path: USER_ID_PATH_PATTERN_MATCHER,
            query: [PAGE_QUERY_PATTERN_MATCHER],
            hash: ANY_HASH_PATTERN_MATCHER,
          },
        ])

        expect(resolver.resolve('/users/24?page=100#bar')).toMatchObject({
          params: { id: 24, page: 100, hash: 'bar' },
        })
      })
    })

    describe('relative locations', () => {
      it('resolves relative string locations', () => {
        const resolver = createFixedResolver([
          { name: 'any-path', path: ANY_PATH_PATTERN_MATCHER },
        ])

        const currentLocation = resolver.resolve({ path: '/nested/' })

        expect(resolver.resolve('foo', currentLocation)).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
        expect(resolver.resolve('../foo', currentLocation)).toMatchObject({
          params: {},
          path: '/foo',
          query: {},
          hash: '',
        })
        expect(resolver.resolve('./foo', currentLocation)).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
      })

      it('resolves relative object locations', () => {
        const resolver = createFixedResolver([
          { name: 'any-path', path: ANY_PATH_PATTERN_MATCHER },
        ])

        const currentLocation = resolver.resolve({ path: '/nested/' })

        expect(
          resolver.resolve({ path: 'foo' }, currentLocation)
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          fullPath: '/nested/foo',
          query: {},
          hash: '',
        })
        expect(
          resolver.resolve({ path: '../foo' }, currentLocation)
        ).toMatchObject({
          params: {},
          path: '/foo',
          fullPath: '/foo',
          query: {},
          hash: '',
        })
        expect(
          resolver.resolve({ path: './foo' }, currentLocation)
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          fullPath: '/nested/foo',
          query: {},
          hash: '',
        })
      })

      it('merges params with current location', () => {
        const resolver = createFixedResolver([
          { name: 'ab', path: AB_PARAMS_PATH_MATCHER },
        ])

        const currentLocation = resolver.resolve({ path: '/A/B' })

        expect(
          resolver.resolve({ params: { b: 'b' } }, currentLocation)
        ).toMatchObject({
          name: 'ab',
          path: '/A/b',
          params: { a: 'A', b: 'b' },
        })
      })

      it('keeps params if not provided', () => {
        const resolver = createFixedResolver([
          { name: 'user-edit', path: USERS_ID_OTHER_PATH_MATCHER },
        ])

        const currentLocation = resolver.resolve({ path: '/users/ed/user' })

        expect(resolver.resolve({}, currentLocation)).toMatchObject({
          name: 'user-edit',
          path: '/users/ed/user',
          params: { id: 'ed', other: 'user' },
        })
      })

      it('replaces params even with no name', () => {
        const resolver = createFixedResolver([
          { name: 'user-edit', path: USERS_ID_OTHER_PATH_MATCHER },
        ])

        const currentLocation = resolver.resolve({ path: '/users/ed/user' })

        expect(
          resolver.resolve(
            { params: { id: 'posva', other: 'admin' } },
            currentLocation
          )
        ).toMatchObject({
          path: '/users/posva/admin',
        })
      })
    })

    describe('absolute locations', () => {
      it('resolves an absolute string location', () => {
        const resolver = createFixedResolver([
          { name: 'root', path: EMPTY_PATH_PATTERN_MATCHER },
        ])
        expect(resolver.resolve('/')).toMatchObject({
          fullPath: '/',
          path: '/',
          params: {},
          query: {},
          hash: '',
        })
      })

      it('resolves an absolute object location', () => {
        const resolver = createFixedResolver([
          { name: 'root', path: EMPTY_PATH_PATTERN_MATCHER },
        ])
        expect(resolver.resolve({ path: '/' })).toMatchObject({
          fullPath: '/',
          path: '/',
          params: {},
          query: {},
          hash: '',
        })
      })

      it('treats object path as pathname only (no query/hash parsing)', () => {
        const resolver = createFixedResolver([
          { name: 'any-path', path: ANY_PATH_PATTERN_MATCHER },
        ])
        // Object with path containing query/hash should treat entire string as pathname
        expect(resolver.resolve({ path: '/?a=a&b=b#h' })).toMatchObject({
          path: '/?a=a&b=b#h',
          query: {},
          hash: '',
          params: { pathMatch: '/?a=a&b=b#h' },
        })
      })
    })

    describe('named locations', () => {
      it('resolves named locations with no params', () => {
        const resolver = createFixedResolver([
          {
            name: 'home',
            path: EMPTY_PATH_PATTERN_MATCHER,
          },
        ])

        expect(resolver.resolve({ name: 'home', params: {} })).toMatchObject({
          name: 'home',
          path: '/',
          params: {},
          query: {},
          hash: '',
        })
      })

      it('resolves named locations with params', () => {
        const resolver = createFixedResolver([
          { name: 'user-edit', path: USERS_ID_OTHER_PATH_MATCHER },
        ])

        expect(
          resolver.resolve({
            name: 'user-edit',
            params: { id: 'posva', other: 'admin' },
          })
        ).toMatchObject({
          name: 'user-edit',
          path: '/users/posva/admin',
          params: { id: 'posva', other: 'admin' },
        })
      })

      it('throws if named route does not exist', () => {
        const resolver = createFixedResolver([])

        expect(() =>
          resolver.resolve({ name: 'nonexistent', params: {} })
        ).toThrowError('Record "nonexistent" not found')
      })
    })

    describe('encoding', () => {
      const resolver = createFixedResolver([
        { name: 'any-path', path: ANY_PATH_PATTERN_MATCHER },
      ])
      describe('decodes', () => {
        it('handles encoded string path', () => {
          expect(resolver.resolve({ path: '/%23%2F%3F' })).toMatchObject({
            fullPath: '/%23%2F%3F',
            path: '/%23%2F%3F',
            query: {},
            // we don't test params here because it's matcher's responsibility to encode the path
            hash: '',
          })
        })

        it('decodes query from a string', () => {
          expect(resolver.resolve('/foo?foo=%23%2F%3F')).toMatchObject({
            path: '/foo',
            fullPath: '/foo?foo=%23%2F%3F',
            query: { foo: '#/?' },
          })
        })

        it('passes a decoded query to the matcher', () => {
          const resolver = createFixedResolver([
            {
              name: 'query',
              path: EMPTY_PATH_PATTERN_MATCHER,
              query: [
                {
                  match(q) {
                    return { q }
                  },
                  build({ q }) {
                    return { ...q }
                  },
                } satisfies MatcherPatternQuery<{ q: MatcherQueryParams }>,
              ],
            },
          ])
          expect(resolver.resolve('/?%23%2F%3F=%23%2F%3F')).toMatchObject({
            params: { q: { '#/?': '#/?' } },
          })
        })

        it('decodes hash from a string', () => {
          expect(resolver.resolve('/foo#%22')).toMatchObject({
            path: '/foo',
            fullPath: '/foo#%22',
            hash: '#"',
          })
        })
      })

      describe('encodes', () => {
        it('encodes the query', () => {
          expect(
            resolver.resolve({ path: '/foo', query: { foo: '"' } })
          ).toMatchObject({
            fullPath: '/foo?foo=%22',
            query: { foo: '"' },
          })
        })

        it('encodes the hash', () => {
          expect(resolver.resolve({ path: '/foo', hash: '#"' })).toMatchObject({
            fullPath: '/foo#%22',
            hash: '#"',
          })
        })
      })
    })

    describe('multiple parameters', () => {
      it('resolves paths with multiple params', () => {
        const resolver = createFixedResolver([
          { name: 'user', path: USERS_ID_OTHER_PATH_MATCHER },
          { name: 'ab', path: AB_PARAMS_PATH_MATCHER },
        ])

        expect(resolver.resolve({ path: '/users/posva/hey' })).toMatchObject({
          name: 'user',
          params: { id: 'posva', other: 'hey' },
          path: '/users/posva/hey',
        })

        expect(resolver.resolve({ path: '/foo/bar' })).toMatchObject({
          name: 'ab',
          params: { a: 'foo', b: 'bar' },
          path: '/foo/bar',
        })
      })
    })

    describe('repeatable parameters', () => {
      it('resolves array of params for repeatable params', () => {
        const resolver = createFixedResolver([
          { name: 'repeatable', path: REPEATABLE_PARAM_MATCHER },
        ])

        expect(
          resolver.resolve({
            name: 'repeatable',
            params: { p: ['b', 'c', 'd'] },
          })
        ).toMatchObject({
          name: 'repeatable',
          path: '/a/b/c/d',
          params: { p: ['b', 'c', 'd'] },
        })
      })

      it('resolves single param for repeatable params', () => {
        const resolver = createFixedResolver([
          { name: 'repeatable', path: REPEATABLE_PARAM_MATCHER },
        ])

        expect(
          resolver.resolve({ name: 'repeatable', params: { p: 'b' } })
        ).toMatchObject({
          name: 'repeatable',
          path: '/a/b',
          params: { p: 'b' },
        })
      })

      it('keeps repeated params as array when provided through path', () => {
        const resolver = createFixedResolver([
          { name: 'repeatable', path: REPEATABLE_PARAM_MATCHER },
        ])

        expect(resolver.resolve({ path: '/a/b/c' })).toMatchObject({
          name: 'repeatable',
          params: { p: ['b', 'c'] },
        })
      })
    })

    describe('optional parameters', () => {
      it('handles optional trailing param', () => {
        const resolver = createFixedResolver([
          { name: 'optional', path: AB_OPTIONAL_PATH_MATCHER },
        ])

        expect(resolver.resolve({ path: '/foo' })).toMatchObject({
          name: 'optional',
          params: { a: 'foo', b: '' },
          path: '/foo',
        })

        expect(resolver.resolve({ path: '/foo/bar' })).toMatchObject({
          name: 'optional',
          params: { a: 'foo', b: 'bar' },
          path: '/foo/bar',
        })
      })

      it('drops optional params in named location', () => {
        const resolver = createFixedResolver([
          { name: 'optional', path: AB_OPTIONAL_PATH_MATCHER },
        ])

        expect(
          resolver.resolve({ name: 'optional', params: { a: 'b' } })
        ).toMatchObject({
          name: 'optional',
          path: '/b',
          params: { a: 'b' },
        })
      })

      it('keeps optional params passed as empty strings', () => {
        const resolver = createFixedResolver([
          { name: 'optional', path: AB_OPTIONAL_PATH_MATCHER },
        ])

        expect(
          resolver.resolve({ name: 'optional', params: { a: 'b', b: '' } })
        ).toMatchObject({
          name: 'optional',
          path: '/b',
          params: { a: 'b', b: '' },
        })
      })
    })

    it('has strict trailing slash handling', () => {
      const resolver = createFixedResolver([
        { name: 'home', path: new MatcherPatternPathStatic('/home') },
        { name: 'home-slash', path: new MatcherPatternPathStatic('/home/') },
      ])

      expect(resolver.resolve({ path: '/home' })).toMatchObject({
        name: 'home',
        path: '/home',
      })

      expect(resolver.resolve({ path: '/home/' })).toMatchObject({
        name: 'home-slash',
        path: '/home/',
      })
    })

    describe('nested routes', () => {
      it('resolves child routes with parent-child relationships', () => {
        const parentRecord = {
          name: 'parent',
          path: new MatcherPatternPathStatic('/parent'),
          parent: null,
        }

        const childRecord = {
          name: 'child',
          path: new MatcherPatternPathStatic('/child'),
          parent: parentRecord,
        }

        const resolver = createFixedResolver([parentRecord, childRecord])

        expect(resolver.resolve({ path: '/child' })).toMatchObject({
          name: 'child',
          path: '/child',
          matched: [parentRecord, childRecord],
        })
      })

      it('resolves child routes with params', () => {
        const parentRecord = {
          name: 'users',
          path: new MatcherPatternPathStatic('/users'),
          parent: null,
        }

        const childRecord = {
          name: 'user-detail',
          path: USER_ID_PATH_PATTERN_MATCHER,
          parent: parentRecord,
        }

        const resolver = createFixedResolver([parentRecord, childRecord])

        expect(resolver.resolve({ path: '/users/123' })).toMatchObject({
          name: 'user-detail',
          params: { id: 123 },
          matched: [parentRecord, childRecord],
        })
      })
    })
  })
})
