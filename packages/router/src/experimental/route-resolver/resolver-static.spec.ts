import { describe, expect, it } from 'vitest'
import { createStaticResolver } from './resolver-static'
import { MatcherQueryParams, NO_MATCH_LOCATION } from './resolver-abstract'
import {
  MatcherPatternQuery,
  MatcherPatternPathStatic,
} from './matchers/matcher-pattern'
import {
  EMPTY_PATH_PATTERN_MATCHER,
  USER_ID_PATH_PATTERN_MATCHER,
  ANY_PATH_PATTERN_MATCHER,
  ANY_HASH_PATTERN_MATCHER,
} from './matchers/test-utils'

const PAGE_QUERY_PATTERN_MATCHER_LOCAL: MatcherPatternQuery<{ page: number }> =
  {
    match: query => {
      const page = Number(query.page)
      return {
        page: Number.isNaN(page) ? 1 : page,
      }
    },
    build: params => ({ page: String(params.page) }),
  } satisfies MatcherPatternQuery<{ page: number }>

describe('StaticResolver', () => {
  describe('new matchers', () => {
    it('static path', () => {
      const resolver = createStaticResolver([
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
      const resolver = createStaticResolver([
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
    describe.todo('absolute locations as strings', () => {
      it('resolves string locations with no params', () => {
        const resolver = createStaticResolver([
          { name: 'root', path: EMPTY_PATH_PATTERN_MATCHER },
        ])

        expect(resolver.resolve({ path: '/?a=a&b=b#h' })).toMatchObject({
          path: '/',
          params: {},
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolves a not found string', () => {
        const resolver = createStaticResolver([])
        expect(resolver.resolve({ path: '/bar?q=1#hash' })).toEqual({
          ...NO_MATCH_LOCATION,
          fullPath: '/bar?q=1#hash',
          path: '/bar',
          query: { q: '1' },
          hash: '#hash',
          matched: [],
        })
      })

      it('resolves string locations with params', () => {
        const resolver = createStaticResolver([
          { name: 'user-detail', path: USER_ID_PATH_PATTERN_MATCHER },
        ])

        expect(resolver.resolve({ path: '/users/1?a=a&b=b#h' })).toMatchObject({
          path: '/users/1',
          params: { id: 1 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
        expect(resolver.resolve({ path: '/users/54?a=a&b=b#h' })).toMatchObject(
          {
            path: '/users/54',
            params: { id: 54 },
            query: { a: 'a', b: 'b' },
            hash: '#h',
          }
        )
      })

      it('resolve string locations with query', () => {
        const resolver = createStaticResolver([
          {
            name: 'any-path',
            path: ANY_PATH_PATTERN_MATCHER,
            query: PAGE_QUERY_PATTERN_MATCHER_LOCAL,
          },
        ])

        expect(resolver.resolve({ path: '/foo?page=100&b=b#h' })).toMatchObject(
          {
            params: { page: 100 },
            path: '/foo',
            query: {
              page: '100',
              b: 'b',
            },
            hash: '#h',
          }
        )
      })

      it('resolves string locations with hash', () => {
        const resolver = createStaticResolver([
          {
            name: 'any-path',
            path: ANY_PATH_PATTERN_MATCHER,
            hash: ANY_HASH_PATTERN_MATCHER,
          },
        ])

        expect(resolver.resolve({ path: '/foo?a=a&b=b#bar' })).toMatchObject({
          hash: '#bar',
          params: { hash: 'bar' },
          path: '/foo',
          query: { a: 'a', b: 'b' },
        })
      })

      it('combines path, query and hash params', () => {
        const resolver = createStaticResolver([
          {
            name: 'user-detail',
            path: USER_ID_PATH_PATTERN_MATCHER,
            query: PAGE_QUERY_PATTERN_MATCHER_LOCAL,
            hash: ANY_HASH_PATTERN_MATCHER,
          },
        ])

        expect(
          resolver.resolve({ path: '/users/24?page=100#bar' })
        ).toMatchObject({
          params: { id: 24, page: 100, hash: 'bar' },
        })
      })
    })

    describe('relative locations as strings', () => {
      it('resolves a simple object relative location', () => {
        const resolver = createStaticResolver([
          { name: 'any-path', path: ANY_PATH_PATTERN_MATCHER },
        ])

        expect(
          resolver.resolve(
            { path: 'foo' },
            resolver.resolve({ path: '/nested/' })
          )
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
        expect(
          resolver.resolve(
            { path: '../foo' },
            resolver.resolve({ path: '/nested/' })
          )
        ).toMatchObject({
          params: {},
          path: '/foo',
          query: {},
          hash: '',
        })
        expect(
          resolver.resolve(
            { path: './foo' },
            resolver.resolve({ path: '/nested/' })
          )
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
      })
    })

    it('resolves a simple string relative location', () => {
      const resolver = createStaticResolver([
        { name: 'any-path', path: ANY_PATH_PATTERN_MATCHER },
      ])

      expect(
        resolver.resolve('foo', resolver.resolve({ path: '/nested/' }))
      ).toMatchObject({
        params: {},
        path: '/nested/foo',
        query: {},
        hash: '',
      })
      expect(
        resolver.resolve('../foo', resolver.resolve({ path: '/nested/' }))
      ).toMatchObject({
        params: {},
        path: '/foo',
        query: {},
        hash: '',
      })
      expect(
        resolver.resolve('./foo', resolver.resolve({ path: '/nested/' }))
      ).toMatchObject({
        params: {},
        path: '/nested/foo',
        query: {},
        hash: '',
      })
    })

    describe('absolute locations', () => {
      it('resolves an object location', () => {
        const resolver = createStaticResolver([
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

      it('resolves an absolute string location', () => {
        const resolver = createStaticResolver([
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
    })

    describe('named locations', () => {
      it('resolves named locations with no params', () => {
        const resolver = createStaticResolver([
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
    })

    describe('encoding', () => {
      const resolver = createStaticResolver([
        { name: 'any-path', path: ANY_PATH_PATTERN_MATCHER },
      ])
      describe('decodes', () => {
        it('handles encoded string path', () => {
          expect(resolver.resolve({ path: '/%23%2F%3F' })).toMatchObject({
            fullPath: '/%23%2F%3F',
            path: '/%23%2F%3F',
            query: {},
            // we don't tests params here becuase it's matcher's responsibility to encode the path
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
          const resolver = createStaticResolver([
            {
              name: 'query',
              path: EMPTY_PATH_PATTERN_MATCHER,
              query: {
                match(q) {
                  return { q }
                },
                build({ q }) {
                  return { ...q }
                },
              } satisfies MatcherPatternQuery<{ q: MatcherQueryParams }>,
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
  })
})
