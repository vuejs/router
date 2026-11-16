import { describe, expect, it } from 'vitest'
import { mockWarn } from '../../../__tests__/vitest-mock-warn'
import { createFixedResolver } from './resolver-fixed'
import { MatcherPatternPathStatic } from './matchers/matcher-pattern'
import { MatcherPatternQueryParam } from './matchers/matcher-pattern-query'
import { MatchMiss } from './matchers/errors'

describe('query params with empty query arrays', () => {
  mockWarn()

  describe.each([
    {
      format: 'value' as const,
      required: false,
      defaultValue: undefined,
      expected: undefined,
    },
    {
      format: 'value' as const,
      required: true,
      defaultValue: undefined,
      expected: undefined,
    },
    {
      format: 'array' as const,
      required: false,
      defaultValue: undefined,
      expected: [],
    },
    {
      format: 'array' as const,
      required: true,
      defaultValue: undefined,
      expected: [],
    },
    {
      format: 'value' as const,
      required: false,
      defaultValue: 'default',
      expected: 'default',
    },
    {
      format: 'value' as const,
      required: true,
      defaultValue: 'default',
      expected: 'default',
    },
  ])(
    'empty query arrays with $format params, required=$required, default=$defaultValue',
    ({ format, required, defaultValue, expected }) => {
      function createResolver() {
        return createFixedResolver([
          {
            name: 'search',
            path: new MatcherPatternPathStatic('/search'),
            query: [
              new MatcherPatternQueryParam(
                'a',
                'a',
                format,
                undefined,
                defaultValue,
                required
              ),
            ],
          },
        ])
      }

      it.each([{ value: [] }, { value: undefined }])(
        'treats query $value as missing in a named location',
        ({ value }) => {
          const resolver = createResolver()
          if (format === 'value' && required && defaultValue === undefined) {
            expect(() =>
              resolver.resolve({ name: 'search', query: { a: value } })
            ).toThrow(MatchMiss)
            expect('VUE_ROUTER_R0125').toHaveBeenWarnedTimes(1)
            return
          }

          const resolved = resolver.resolve({
            name: 'search',
            query: { a: value },
          })
          expect(resolved.query).toEqual({})
          expect(resolved.params).toEqual({ a: expected })
          expect(resolved.fullPath).toBe('/search')
          expect(resolver.resolve(resolved.fullPath)).toEqual(resolved)
        }
      )

      it('keeps a null query value present', () => {
        const resolver = createResolver()
        const resolved = resolver.resolve({
          name: 'search',
          query: { a: [null] },
        })
        expect(resolved.query).toEqual({ a: [null] })
        expect(resolved.params).toEqual({
          a: format === 'array' ? [null] : null,
        })
        expect(resolved.fullPath).toBe('/search?a')
        expect(resolver.resolve(resolved.fullPath)).toEqual(resolved)
      })

      it.each([{ value: [] }, { value: undefined }])(
        'rebuilds an inherited param over query $value in a relative location',
        ({ value }) => {
          const resolver = createResolver()
          const current = resolver.resolve('/search?a=old')
          const resolved = resolver.resolve({ query: { a: value } }, current)
          expect(resolved.query).toEqual({ a: ['old'] })
          expect(resolved.params).toEqual({
            a: format === 'array' ? ['old'] : 'old',
          })
          expect(resolved.fullPath).toBe('/search?a=old')
          expect(resolver.resolve(resolved.fullPath)).toEqual(resolved)
        }
      )
    }
  )
})
