import { describe, expect, it } from 'vitest'
import { MatcherPatternImpl, MatcherPatternPath } from './matcher-pattern'
import { createCompiledMatcher } from './matcher'

function createMatcherPattern(
  ...args: ConstructorParameters<typeof MatcherPatternImpl>
) {
  return new MatcherPatternImpl(...args)
}

const EMPTY_PATH_PATTERN_MATCHER = {
  match: (path: string) => ({}),
  parse: (params: {}) => ({}),
  serialize: (params: {}) => ({}),
  buildPath: () => '/',
} satisfies MatcherPatternPath

describe('Matcher', () => {
  describe('resolve()', () => {
    describe('absolute locationss as strings', () => {
      it('resolves string locations with no params', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(
          createMatcherPattern(Symbol('foo'), EMPTY_PATH_PATTERN_MATCHER)
        )

        expect(matcher.resolve('/foo?a=a&b=b#h')).toMatchObject({
          path: '/foo',
          params: {},
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolves string locations with params', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(
          // /users/:id
          createMatcherPattern(Symbol('foo'), {
            match: (path: string) => {
              const match = path.match(/^\/foo\/([^/]+?)$/)
              if (!match) throw new Error('no match')
              return { id: match[1] }
            },
            parse: (params: { id: string }) => ({ id: Number(params.id) }),
            serialize: (params: { id: number }) => ({ id: String(params.id) }),
            buildPath: params => `/foo/${params.id}`,
          })
        )

        expect(matcher.resolve('/foo/1?a=a&b=b#h')).toMatchObject({
          path: '/foo/1',
          params: { id: 1 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
        expect(matcher.resolve('/foo/54?a=a&b=b#h')).toMatchObject({
          path: '/foo/54',
          params: { id: 54 },
          query: { a: 'a', b: 'b' },
          hash: '#h',
        })
      })

      it('resolve string locations with query', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(
          createMatcherPattern(Symbol('foo'), EMPTY_PATH_PATTERN_MATCHER, {
            match: query => ({
              id: Array.isArray(query.id) ? query.id[0] : query.id,
            }),
            parse: (params: { id: string }) => ({ id: Number(params.id) }),
            serialize: (params: { id: number }) => ({ id: String(params.id) }),
          })
        )

        expect(matcher.resolve('/foo?id=100&b=b#h')).toMatchObject({
          params: { id: 100 },
          path: '/foo',
          query: {
            id: '100',
            b: 'b',
          },
          hash: '#h',
        })
      })

      it('resolves string locations with hash', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(
          createMatcherPattern(
            Symbol('foo'),
            EMPTY_PATH_PATTERN_MATCHER,
            undefined,
            {
              match: hash => hash,
              parse: hash => ({ a: hash.slice(1) }),
              serialize: ({ a }) => '#a',
            }
          )
        )

        expect(matcher.resolve('/foo?a=a&b=b#bar')).toMatchObject({
          hash: '#bar',
          params: { a: 'bar' },
          path: '/foo',
          query: { a: 'a', b: 'b' },
        })
      })

      it('returns a valid location with an empty `matched` array if no match', () => {
        const matcher = createCompiledMatcher()
        expect(matcher.resolve('/bar')).toMatchInlineSnapshot(
          {
            hash: '',
            matched: [],
            params: {},
            path: '/bar',
            query: {},
          },
          `
          {
            "fullPath": "/bar",
            "hash": "",
            "matched": [],
            "name": Symbol(no-match),
            "params": {},
            "path": "/bar",
            "query": {},
          }
        `
        )
      })

      it('resolves string locations with all', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(
          createMatcherPattern(
            Symbol('foo'),
            {
              buildPath: params => `/foo/${params.id}`,
              match: path => {
                const match = path.match(/^\/foo\/([^/]+?)$/)
                if (!match) throw new Error('no match')
                return { id: match[1] }
              },
              parse: params => ({ id: Number(params.id) }),
              serialize: params => ({ id: String(params.id) }),
            },
            {
              match: query => ({
                id: Array.isArray(query.id) ? query.id[0] : query.id,
              }),
              parse: params => ({ q: Number(params.id) }),
              serialize: params => ({ id: String(params.q) }),
            },
            {
              match: hash => hash,
              parse: hash => ({ a: hash.slice(1) }),
              serialize: ({ a }) => '#a',
            }
          )
        )

        expect(matcher.resolve('/foo/1?id=100#bar')).toMatchObject({
          hash: '#bar',
          params: { id: 1, q: 100, a: 'bar' },
        })
      })
    })

    describe('relative locations as strings', () => {
      it('resolves a simple relative location', () => {
        const matcher = createCompiledMatcher()
        matcher.addRoute(
          createMatcherPattern(Symbol('foo'), EMPTY_PATH_PATTERN_MATCHER)
        )

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
        matcher.addRoute(
          createMatcherPattern('home', EMPTY_PATH_PATTERN_MATCHER)
        )

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
