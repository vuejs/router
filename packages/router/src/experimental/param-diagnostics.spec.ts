import { describe, expect, it } from 'vitest'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import { MatcherPatternPathDynamic } from './route-resolver/matchers/matcher-pattern'
import { defineParamParserRaw } from './route-resolver/matchers/param-parsers'
import { mockWarn } from '../tests/vitest-mock-warn'

mockWarn()

function resolver(subsegment = false) {
  return createFixedResolver([
    {
      name: 'optional',
      path: new MatcherPatternPathDynamic(
        subsegment ? /^\/optional\/pre([^/]+)?$/ : /^\/optional(?:\/([^/]+))?$/,
        { p: [undefined, false, true] },
        subsegment ? ['optional', ['pre', 1]] : ['optional', 1]
      ),
    },
  ])
}

describe('optional param removal diagnostics', () => {
  it.each([undefined, ''])(
    'advises null instead of %s in named navigation',
    p => {
      expect(
        resolver().resolve({ name: 'optional', params: { p } })
      ).toMatchObject({
        path: '/optional',
        params: { p: null },
      })
      if (__DEV__) {
        expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
        expect('Use null').toHaveBeenWarned()
        expect('optional path param "p"').toHaveBeenWarned()
      }
    }
  )

  it.each([undefined, ''])(
    'advises null instead of %s in relative navigation',
    p => {
      const routes = resolver()
      const current = routes.resolve({ name: 'optional', params: { p: 'a' } })
      expect(routes.resolve({ params: { p } }, current)).toMatchObject({
        path: '/optional',
        params: { p: null },
      })
      expect(current.params).toEqual({ p: 'a' })
      if (__DEV__) expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
    }
  )

  it.each([undefined, ''])('reports %s removal inside a subsegment', p => {
    expect(
      resolver(true).resolve({ name: 'optional', params: { p } })
    ).toMatchObject({
      path: '/optional/pre',
      params: { p: null },
    })
    if (__DEV__) expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
  })

  it('does not warn for null, omitted params, or normal values', () => {
    const routes = resolver()
    expect(
      routes.resolve({ name: 'optional', params: { p: null } }).params
    ).toEqual({ p: null })
    expect(routes.resolve({ name: 'optional', params: {} }).params).toEqual({
      p: null,
    })
    const current = routes.resolve({ name: 'optional', params: { p: 'a' } })
    expect(routes.resolve({ params: {} }, current).params).toEqual({ p: 'a' })
    expect(routes.resolve('/optional').params).toEqual({ p: null })
  })

  it('keeps custom parser removal values', () => {
    const parser = defineParamParserRaw<Set<string>>({
      get: value => new Set(value == null ? [] : [String(value)]),
      set: value => [...value],
    })
    const routes = createFixedResolver([
      {
        name: 'raw',
        path: new MatcherPatternPathDynamic(
          /^\/optional(?:\/([^/]+))?$/,
          { p: [parser, false, true] },
          ['optional', 1]
        ),
      },
    ])
    expect(
      routes.resolve({ name: 'raw', params: { p: new Set() } })
    ).toMatchObject({
      path: '/optional',
      params: { p: new Set() },
    })
  })

  it('does not warn when an empty string is serialized as a value', () => {
    const parser = defineParamParserRaw<string>({
      get: value => String(value),
      set: value => (value === '' ? 'empty' : value),
    })
    const routes = createFixedResolver([
      {
        name: 'raw',
        path: new MatcherPatternPathDynamic(
          /^\/optional(?:\/([^/]+))?$/,
          { p: [parser, false, true] },
          ['optional', 1]
        ),
      },
    ])
    expect(routes.resolve({ name: 'raw', params: { p: '' } })).toMatchObject({
      path: '/optional/empty',
      params: { p: 'empty' },
    })
  })
})
