import { describe, expect, it } from 'vitest'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './route-resolver/matchers/matcher-pattern'
import { MatcherPatternQueryParam } from './route-resolver/matchers/matcher-pattern-query'
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

describe('ignored query param diagnostics', () => {
  const r = createFixedResolver([
    {
      name: 'list',
      path: new MatcherPatternPathStatic('/'),
      query: [
        new MatcherPatternQueryParam('page', 'page', 'value'),
        new MatcherPatternQueryParam('tags', 'tags', 'array'),
      ],
    },
  ])
  const current = r.resolve('/?page=5')

  it('warns when a query value is ignored for a param', () => {
    expect(r.resolve({ query: { page: ['3'] } }, current)).toMatchObject({
      fullPath: '/?page=5',
    })
    if (__DEV__) {
      expect('VUE_ROUTER_R0123').toHaveBeenWarnedTimes(1)
      expect('"page"').toHaveBeenWarned()
    }
  })

  it('does not warn when the query value is used', () => {
    r.resolve({ query: { ...current.query, other: ['x'] } }, current)
    r.resolve({ name: 'list', params: {}, query: { page: ['3'] } })
    expect('VUE_ROUTER_R0123').not.toHaveBeenWarned()
  })

  it('does not warn for a null value on a key without a param', () => {
    r.resolve({ name: 'list', params: {}, query: { flag: null } })
    expect('VUE_ROUTER_R0123').not.toHaveBeenWarned()
    // non array values are deprecated
    if (__DEV__) expect('VUE_ROUTER_D0002').toHaveBeenWarnedTimes(1)
  })

  it('compares array values element by element', () => {
    expect(
      r.resolve({
        name: 'list',
        params: { tags: ['a', 'b'] },
        query: { tags: ['a,b'] },
      })
    ).toMatchObject({ fullPath: '/?tags=a&tags=b' })
    if (__DEV__) expect('VUE_ROUTER_R0123').toHaveBeenWarnedTimes(1)
  })
})

describe('repeatable param diagnostics', () => {
  function resolver(subsegment = false) {
    return createFixedResolver([
      {
        name: 'repeat',
        path: new MatcherPatternPathDynamic(
          subsegment ? /^\/repeat\/pre(.+)?$/ : /^\/repeat(?:\/(.+))?$/,
          { p: [undefined, true, true] },
          subsegment ? ['repeat', ['pre', 1]] : ['repeat', 1]
        ),
      },
    ])
  }

  it.each([false, true])('warns for a scalar (subsegment: %s)', subsegment => {
    expect(
      resolver(subsegment).resolve({ name: 'repeat', params: { p: 'a' } })
        .params
    ).toEqual({ p: ['a'] })
    if (__DEV__) expect('VUE_ROUTER_R0106').toHaveBeenWarnedTimes(1)
  })

  it('does not warn for arrays, null, or omitted params', () => {
    const routes = resolver()
    expect(
      routes.resolve({ name: 'repeat', params: { p: ['a', 'b'] } }).path
    ).toBe('/repeat/a/b')
    expect(routes.resolve({ name: 'repeat', params: { p: [] } }).path).toBe(
      '/repeat'
    )
    expect(routes.resolve({ name: 'repeat', params: { p: null } }).path).toBe(
      '/repeat'
    )
    expect(routes.resolve({ name: 'repeat', params: {} }).path).toBe('/repeat')
  })
})
