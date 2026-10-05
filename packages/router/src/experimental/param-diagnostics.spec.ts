import { describe, expect, it } from 'vitest'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import { MatcherPatternPathDynamic } from './route-resolver/matchers/matcher-pattern'
import { defineParamParserRaw } from './route-resolver/matchers/param-parsers'
import { miss } from './route-resolver/matchers/errors'
import { mockWarn } from '../tests/vitest-mock-warn'

mockWarn()

function resolver() {
  const parser = defineParamParserRaw<number | null>({
    get: value => {
      if (value == null) return null
      const number = Number(value)
      if (!Number.isFinite(number)) miss('Expected a number')
      return number
    },
    set: value => (value == null ? null : String(value)),
  })
  return createFixedResolver([
    {
      name: 'optional-number',
      path: new MatcherPatternPathDynamic(
        /^\/optional(?:\/([^/]+))?$/,
        { p: [parser, false, true] },
        ['optional', 1]
      ),
    },
  ])
}

describe('param resolution diagnostics', () => {
  it.each([false, true])(
    'reports a parser failure on relative=%s navigation',
    relative => {
      const routes = resolver()
      const current = routes.resolve({
        name: 'optional-number',
        params: { p: 2 },
      })
      expect(() =>
        relative
          ? routes.resolve({ params: { p: 'invalid' } }, current)
          : routes.resolve({
              name: 'optional-number',
              params: { p: 'invalid' },
            })
      ).toThrow('Expected a number')
      if (__DEV__) {
        expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
        expect('optional-number').toHaveBeenWarned()
        expect('Expected a number').toHaveBeenWarned()
      }
    }
  )

  it('does not report normal misses when resolving a URL', () => {
    expect(resolver().resolve('/optional/invalid').matched).toEqual([])
  })

  it('accepts the raw parser removal value', () => {
    expect(
      resolver().resolve({ name: 'optional-number', params: { p: null } })
    ).toMatchObject({
      path: '/optional',
      params: { p: null },
    })
  })

  it('preserves an error thrown while serializing params', () => {
    const cause = new TypeError('Expected a Set')
    const parser = defineParamParserRaw<Set<string>>({
      get: () => new Set(),
      set: value => {
        if (!(value instanceof Set)) throw cause
        return [...value]
      },
    })
    const routes = createFixedResolver([
      {
        name: 'raw-set',
        path: new MatcherPatternPathDynamic(
          /^\/set(?:\/([^/]+))?$/,
          { p: [parser] },
          ['set', 1]
        ),
      },
    ])
    let thrown: unknown
    try {
      routes.resolve({ name: 'raw-set', params: { p: '' } })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBe(cause)
    if (__DEV__) {
      expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
      expect('raw-set').toHaveBeenWarned()
      expect('Expected a Set').toHaveBeenWarned()
    }
  })
})
