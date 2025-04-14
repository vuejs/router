import { describe, expect, it } from 'vitest'
import {
  createCompiledMatcher,
  NO_MATCH_LOCATION,
  pathEncoded,
} from './resolver'
import {
  MatcherPatternParams_Base,
  MatcherPatternPath,
  MatcherPatternQuery,
  MatcherPatternPathStatic,
  MatcherPatternPathDynamic,
} from './matcher-pattern'
import { miss } from './matchers/errors'
import { EmptyParams } from './matcher-location'
import {
  EMPTY_PATH_ROUTE,
  USER_ID_ROUTE,
  ANY_PATH_ROUTE,
} from './matchers/test-utils'

const ANY_PATH_PATTERN_MATCHER: MatcherPatternPath<{ pathMatch: string }> = {
  match(path) {
    return { pathMatch: path }
  },
  build({ pathMatch }) {
    return pathMatch
  },
}

const EMPTY_PATH_PATTERN_MATCHER: MatcherPatternPath<EmptyParams> = {
  match: path => {
    if (path !== '/') {
      throw miss()
    }
    return {}
  },
  build: () => '/',
}

const USER_ID_PATH_PATTERN_MATCHER: MatcherPatternPath<{ id: number }> = {
  match(value) {
    const match = value.match(/^\/users\/(\d+)$/)
    if (!match?.[1]) {
      throw miss()
    }
    const id = Number(match[1])
    if (Number.isNaN(id)) {
      throw miss()
    }
    return { id }
  },
  build({ id }) {
    return `/users/${id}`
  },
}

const PAGE_QUERY_PATTERN_MATCHER: MatcherPatternQuery<{ page: number }> = {
  match: query => {
    const page = Number(query.page)
    return {
      page: Number.isNaN(page) ? 1 : page,
    }
  },
  build: params => ({ page: String(params.page) }),
} satisfies MatcherPatternQuery<{ page: number }>

const ANY_HASH_PATTERN_MATCHER: MatcherPatternParams_Base<
  string,
  { hash: string | null }
> = {
  match: hash => ({ hash: hash ? hash.slice(1) : null }),
  build: ({ hash }) => (hash ? `#${hash}` : ''),
}

describe('RouterMatcher', () => {
  describe('new matchers', () => {
    it('static path', () => {
      const matcher = createCompiledMatcher([
        { path: new MatcherPatternPathStatic('/'), score: [[80]] },
        { path: new MatcherPatternPathStatic('/users'), score: [[80]] },
      ])

      expect(matcher.resolve({ path: '/' })).toMatchObject({
        fullPath: '/',
        path: '/',
        params: {},
        query: {},
        hash: '',
      })

      expect(matcher.resolve({ path: '/users' })).toMatchObject({
        fullPath: '/users',
        path: '/users',
        params: {},
        query: {},
        hash: '',
      })
    })

    it('dynamic path', () => {
      const matcher = createCompiledMatcher([
        {
          score: [[80], [70]],
          path: new MatcherPatternPathDynamic<{ id: string }>(
            /^\/users\/([^\/]+)$/,
            {
              id: {},
            },
            ({ id }) => pathEncoded`/users/${id}`
          ),
        },
      ])

      expect(matcher.resolve({ path: '/users/1' })).toMatchObject({
        fullPath: '/users/1',
        path: '/users/1',
        params: { id: '1' },
      })
    })
  })

  describe('adding and removing', () => {
    it('add static path', () => {
      const matcher = createCompiledMatcher()
      matcher.addMatcher(EMPTY_PATH_ROUTE)
    })

    it('adds dynamic path', () => {
      const matcher = createCompiledMatcher()
      matcher.addMatcher(USER_ID_ROUTE)
    })

    it('removes static path', () => {
      const matcher = createCompiledMatcher()
      matcher.addMatcher(EMPTY_PATH_ROUTE)
      matcher.removeMatcher(EMPTY_PATH_ROUTE)
      // Add assertions to verify the route was removed
    })

    it('removes dynamic path', () => {
      const matcher = createCompiledMatcher()
      matcher.addMatcher(USER_ID_ROUTE)
      matcher.removeMatcher(USER_ID_ROUTE)
      // Add assertions to verify the route was removed
    })
  })

  describe('resolve()', () => {
    describe.todo('absolute locations as strings', () => {
      it('resolves string locations with no params', () => {
        const matcher = createCompiledMatcher([EMPTY_PATH_ROUTE])

        expect(matcher.resolve({ path: '/?a=a&b=b#h' })).toMatchObject({
          path: '/',
          params: {},
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolves a not found string', () => {
        const matcher = createCompiledMatcher()
        expect(matcher.resolve({ path: '/bar?q=1#hash' })).toEqual({
          ...NO_MATCH_LOCATION,
          fullPath: '/bar?q=1#hash',
          path: '/bar',
          query: { q: '1' },
          hash: '#hash',
          matched: [],
        })
      })

      it('resolves string locations with params', () => {
        const matcher = createCompiledMatcher([USER_ID_ROUTE])

        expect(matcher.resolve({ path: '/users/1?a=a&b=b#h' })).toMatchObject({
          path: '/users/1',
          params: { id: 1 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
        expect(matcher.resolve({ path: '/users/54?a=a&b=b#h' })).toMatchObject({
          path: '/users/54',
          params: { id: 54 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolve string locations with query', () => {
        const matcher = createCompiledMatcher([
          {
            path: ANY_PATH_PATTERN_MATCHER,
            score: [[100, -10]],
            query: PAGE_QUERY_PATTERN_MATCHER,
          },
        ])

        expect(matcher.resolve({ path: '/foo?page=100&b=b#h' })).toMatchObject({
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
        const matcher = createCompiledMatcher([
          {
            score: [[100, -10]],
            path: ANY_PATH_PATTERN_MATCHER,
            hash: ANY_HASH_PATTERN_MATCHER,
          },
        ])

        expect(matcher.resolve({ path: '/foo?a=a&b=b#bar' })).toMatchObject({
          hash: '#bar',
          params: { hash: 'bar' },
          path: '/foo',
          query: { a: 'a', b: 'b' },
        })
      })

      it('combines path, query and hash params', () => {
        const matcher = createCompiledMatcher([
          {
            score: [[200, 80], [72]],
            path: USER_ID_PATH_PATTERN_MATCHER,
            query: PAGE_QUERY_PATTERN_MATCHER,
            hash: ANY_HASH_PATTERN_MATCHER,
          },
        ])

        expect(
          matcher.resolve({ path: '/users/24?page=100#bar' })
        ).toMatchObject({
          params: { id: 24, page: 100, hash: 'bar' },
        })
      })
    })

    describe('relative locations as strings', () => {
      it('resolves a simple relative location', () => {
        const matcher = createCompiledMatcher([
          { path: ANY_PATH_PATTERN_MATCHER, score: [[-10]] },
        ])

        expect(
          matcher.resolve(
            { path: 'foo' },
            matcher.resolve({ path: '/nested/' })
          )
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
        expect(
          matcher.resolve(
            { path: '../foo' },
            matcher.resolve({ path: '/nested/' })
          )
        ).toMatchObject({
          params: {},
          path: '/foo',
          query: {},
          hash: '',
        })
        expect(
          matcher.resolve(
            { path: './foo' },
            matcher.resolve({ path: '/nested/' })
          )
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
      })
    })

    describe('absolute locations as objects', () => {
      it('resolves an object location', () => {
        const matcher = createCompiledMatcher([EMPTY_PATH_ROUTE])
        expect(matcher.resolve({ path: '/' })).toMatchObject({
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
        const matcher = createCompiledMatcher([
          {
            name: 'home',
            path: EMPTY_PATH_PATTERN_MATCHER,
            score: [[80]],
          },
        ])

        expect(matcher.resolve({ name: 'home', params: {} })).toMatchObject({
          name: 'home',
          path: '/',
          params: {},
          query: {},
          hash: '',
        })
      })
    })

    describe('encoding', () => {
      const matcher = createCompiledMatcher([ANY_PATH_ROUTE])
      describe('decodes', () => {
        it('handles encoded string path', () => {
          expect(matcher.resolve({ path: '/%23%2F%3F' })).toMatchObject({
            fullPath: '/%23%2F%3F',
            path: '/%23%2F%3F',
            query: {},
            params: {},
            hash: '',
          })
        })

        it('decodes query from a string', () => {
          expect(matcher.resolve('/foo?foo=%23%2F%3F')).toMatchObject({
            path: '/foo',
            fullPath: '/foo?foo=%23%2F%3F',
            query: { foo: '#/?' },
          })
        })

        it('decodes hash from a string', () => {
          expect(matcher.resolve('/foo#%22')).toMatchObject({
            path: '/foo',
            fullPath: '/foo#%22',
            hash: '#"',
          })
        })
      })

      describe('encodes', () => {
        it('encodes the query', () => {
          expect(
            matcher.resolve({ path: '/foo', query: { foo: '"' } })
          ).toMatchObject({
            fullPath: '/foo?foo=%22',
            query: { foo: '"' },
          })
        })

        it('encodes the hash', () => {
          expect(matcher.resolve({ path: '/foo', hash: '#"' })).toMatchObject({
            fullPath: '/foo#%22',
            hash: '#"',
          })
        })
      })
    })
  })
})
