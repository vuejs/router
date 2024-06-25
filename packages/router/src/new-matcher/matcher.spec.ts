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
  format: (params: {}) => ({}),
} satisfies MatcherPatternPath

describe('Matcher', () => {
  describe('resolve()', () => {
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
          format: (params: { id: string }) => ({ id: Number(params.id) }),
        })
      )

      expect(matcher.resolve('/foo/1')).toMatchObject({
        path: '/foo/1',
        params: { id: 1 },
        query: {},
        hash: '',
      })
      expect(matcher.resolve('/foo/54')).toMatchObject({
        path: '/foo/54',
        params: { id: 54 },
        query: {},
        hash: '',
      })
    })

    it('resolve string locations with query', () => {
      const matcher = createCompiledMatcher()
      matcher.addRoute(
        createMatcherPattern(Symbol('foo'), EMPTY_PATH_PATTERN_MATCHER, {
          match: query => ({
            id: Array.isArray(query.id) ? query.id[0] : query.id,
          }),
          format: (params: { id: string }) => ({ id: Number(params.id) }),
        })
      )

      expect(matcher.resolve('/foo?id=100')).toMatchObject({
        hash: '',
        params: {
          id: 100,
        },
        path: '/foo',
        query: {
          id: '100',
        },
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
            format: hash => ({ a: hash.slice(1) }),
          }
        )
      )

      expect(matcher.resolve('/foo#bar')).toMatchObject({
        hash: '#bar',
        params: { a: 'bar' },
        path: '/foo',
        query: {},
      })
    })
  })
})
