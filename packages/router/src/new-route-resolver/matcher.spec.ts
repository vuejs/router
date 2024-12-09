import { describe, expect, it } from 'vitest'
import { createCompiledMatcher, NO_MATCH_LOCATION } from './matcher'
import {
  MatcherPatternParams_Base,
  MatcherPattern,
  MatcherPatternPath,
  MatcherPatternQuery,
} from './new-matcher-pattern'
import { miss } from './matchers/errors'
import { EmptyParams } from './matcher-location'

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

const EMPTY_PATH_ROUTE = {
  name: 'no params',
  path: EMPTY_PATH_PATTERN_MATCHER,
} satisfies MatcherPattern

const USER_ID_ROUTE = {
  name: 'user-id',
  path: USER_ID_PATH_PATTERN_MATCHER,
} satisfies MatcherPattern

describe('Matcher', () => {
  describe('adding and removing', () => {
    it('add static path', () => {
      const matcher = createCompiledMatcher()
      matcher.addRoute(EMPTY_PATH_ROUTE)
    })

    it('adds dynamic path', () => {
      const matcher = createCompiledMatcher()
      matcher.addRoute(USER_ID_ROUTE)
    })
  })

  describe('resolve()', () => {
    describe('absolute locationss as strings', () => {
      it('resolves string locations with no params', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(EMPTY_PATH_ROUTE)

        expect(matcher.resolve('/?a=a&b=b#h')).toMatchObject({
          path: '/',
          params: {},
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolves a not found string', () => {
        const matcher = createCompiledMatcher()
        expect(matcher.resolve('/bar?q=1#hash')).toEqual({
          ...NO_MATCH_LOCATION,
          fullPath: '/bar?q=1#hash',
          path: '/bar',
          query: { q: '1' },
          hash: '#hash',
          matched: [],
        })
      })

      it('resolves string locations with params', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(USER_ID_ROUTE)

        expect(matcher.resolve('/users/1?a=a&b=b#h')).toMatchObject({
          path: '/users/1',
          params: { id: 1 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
        expect(matcher.resolve('/users/54?a=a&b=b#h')).toMatchObject({
          path: '/users/54',
          params: { id: 54 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolve string locations with query', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute({
          path: ANY_PATH_PATTERN_MATCHER,
          query: PAGE_QUERY_PATTERN_MATCHER,
        })

        expect(matcher.resolve('/foo?page=100&b=b#h')).toMatchObject({
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
        const matcher = createCompiledMatcher()
        matcher.addRoute({
          path: ANY_PATH_PATTERN_MATCHER,
          hash: ANY_HASH_PATTERN_MATCHER,
        })

        expect(matcher.resolve('/foo?a=a&b=b#bar')).toMatchObject({
          hash: '#bar',
          params: { hash: 'bar' },
          path: '/foo',
          query: { a: 'a', b: 'b' },
        })
      })

      it('combines path, query and hash params', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute({
          path: USER_ID_PATH_PATTERN_MATCHER,
          query: PAGE_QUERY_PATTERN_MATCHER,
          hash: ANY_HASH_PATTERN_MATCHER,
        })

        expect(matcher.resolve('/users/24?page=100#bar')).toMatchObject({
          params: { id: 24, page: 100, hash: 'bar' },
        })
      })
    })

    describe('relative locations as strings', () => {
      it('resolves a simple relative location', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute({ path: ANY_PATH_PATTERN_MATCHER })

        expect(
          matcher.resolve('foo', matcher.resolve('/nested/'))
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
        expect(
          matcher.resolve('../foo', matcher.resolve('/nested/'))
        ).toMatchObject({
          params: {},
          path: '/foo',
          query: {},
          hash: '',
        })
        expect(
          matcher.resolve('./foo', matcher.resolve('/nested/'))
        ).toMatchObject({
          params: {},
          path: '/nested/foo',
          query: {},
          hash: '',
        })
      })
    })

    describe('named locations', () => {
      it('resolves named locations with no params', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute({
          name: 'home',
          path: EMPTY_PATH_PATTERN_MATCHER,
        })

        expect(matcher.resolve({ name: 'home', params: {} })).toMatchObject({
          name: 'home',
          path: '/',
          params: {},
          query: {},
          hash: '',
        })
      })
    })
  })
})
