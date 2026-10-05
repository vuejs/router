import { normalizeQuery, parseQuery, stringifyQuery } from '../src/query'
import {
  isSameRouteLocationParams,
  START_LOCATION_NORMALIZED,
} from '../src/location'
import { createRouterMatcher } from '../src/matcher'
import { applyToParams } from '../src/utils'
import type { RouteComponent } from '../src/types'
import { defineComponent } from 'vue'
import { mockWarn } from './vitest-mock-warn'
import { describe, expect, it } from 'vitest'

const component: RouteComponent = defineComponent({})

describe('prototype-chain keys in params and query', () => {
  mockWarn()

  describe('parseQuery', () => {
    it('does not leak builtin members into the query', () => {
      expect(parseQuery('?toString=a&toString=b')).toEqual({
        toString: ['a', 'b'],
      })
      expect(parseQuery('?constructor=x')).toEqual({ constructor: 'x' })
      expect(parseQuery('?hasOwnProperty=1&hasOwnProperty=2')).toEqual({
        hasOwnProperty: ['1', '2'],
      })
      expect(parseQuery('?valueOf=1')).toEqual({ valueOf: '1' })
    })

    it('stores __proto__ as a regular key instead of changing the prototype', () => {
      const query = parseQuery('?__proto__=x&a=1')
      expect(Object.getPrototypeOf(query)).toBe(Object.prototype)
      expect(Object.keys(query)).toEqual(['__proto__', 'a'])
      expect(query.__proto__).toBe('x')
      expect(query.a).toBe('1')
    })

    it('collects repeated __proto__ keys into an array', () => {
      const query = parseQuery('?__proto__=a&__proto__=b')
      expect(Object.getPrototypeOf(query)).toBe(Object.prototype)
      expect(query.__proto__).toEqual(['a', 'b'])
    })

    it('encodes keys that decode to __proto__', () => {
      const query = parseQuery('?%5F%5Fproto%5F%5F=x')
      expect(Object.getPrototypeOf(query)).toBe(Object.prototype)
      expect(query.__proto__).toBe('x')
    })
  })

  describe('stringifyQuery', () => {
    it('skips inherited enumerable properties', () => {
      const query = Object.assign(Object.create({ polluted: '1' }), {
        a: '1',
      })
      expect(stringifyQuery(query)).toBe('a=1')
    })

    it('serializes an own __proto__ key', () => {
      expect(stringifyQuery(parseQuery('?__proto__=x'))).toBe('__proto__=x')
    })
  })

  describe('normalizeQuery', () => {
    it('skips inherited enumerable properties', () => {
      const query = Object.assign(Object.create({ polluted: '1' }), {
        a: '1',
      })
      expect(normalizeQuery(query)).toEqual({ a: '1' })
    })

    it('keeps an own __proto__ key', () => {
      // JSON.parse creates __proto__ as an own property, unlike an object
      // literal which would invoke the prototype setter
      const query = normalizeQuery(JSON.parse('{"__proto__":"x","a":"1"}'))
      expect(Object.getPrototypeOf(query)).toBe(Object.prototype)
      expect(Object.keys(query)).toEqual(['__proto__', 'a'])
      expect(query.__proto__).toBe('x')
    })
  })

  describe('matcher params', () => {
    it('parses params named after builtins', () => {
      const matcher = createRouterMatcher(
        [{ path: '/:toString/:constructor', component }],
        {}
      )
      const resolved = matcher.resolve(
        { path: '/a/b' },
        START_LOCATION_NORMALIZED
      )
      expect(resolved.params).toEqual({ toString: 'a', constructor: 'b' })
    })

    it('parses a param named __proto__', () => {
      const matcher = createRouterMatcher(
        [{ path: '/:__proto__', component }],
        {}
      )
      const resolved = matcher.resolve(
        { path: '/v' },
        START_LOCATION_NORMALIZED
      )
      expect(Object.getPrototypeOf(resolved.params)).toBe(Object.prototype)
      expect(Object.keys(resolved.params)).toEqual(['__proto__'])
      expect(resolved.params.__proto__).toBe('v')
    })

    it('throws Missing required param for builtin-named params instead of using the prototype', () => {
      const matcher = createRouterMatcher(
        [{ path: '/:toString', name: 't', component }],
        {}
      )
      expect(() =>
        matcher.resolve({ name: 't', params: {} }, START_LOCATION_NORMALIZED)
      ).toThrowError('Missing required param "toString"')
    })

    it('keeps __proto__ params through a named resolve', () => {
      const matcher = createRouterMatcher(
        [{ path: '/:__proto__', name: 't', component }],
        {}
      )
      const resolved = matcher.resolve(
        { name: 't', params: JSON.parse('{"__proto__":"v"}') },
        START_LOCATION_NORMALIZED
      )
      expect(resolved.path).toBe('/v')
      expect(resolved.params.__proto__).toBe('v')
    })

    it('keeps __proto__ params through relative resolves', () => {
      const matcher = createRouterMatcher(
        [{ path: '/:__proto__', name: 't', component }],
        {}
      )
      const current = matcher.resolve({ path: '/a' }, START_LOCATION_NORMALIZED)
      // resolving the same location merges current params
      const resolved = matcher.resolve({}, current)
      expect(resolved.path).toBe('/a')
      expect(resolved.params.__proto__).toBe('a')
    })
  })

  describe('isSameRouteLocationParams', () => {
    it('compares params named after builtins', () => {
      expect(
        isSameRouteLocationParams({ toString: 'a' }, { toString: 'a' })
      ).toBe(true)
      expect(
        isSameRouteLocationParams({ toString: 'a' }, { toString: 'b' })
      ).toBe(false)
      // `toString` is not an own key of the second object: the builtin on the
      // prototype must not count as a value
      expect(
        isSameRouteLocationParams(
          { a: '1', toString: 'x' },
          { a: '1', constructor: 'x' }
        )
      ).toBe(false)
    })
  })

  describe('applyToParams', () => {
    it('skips inherited enumerable properties and keeps __proto__', () => {
      // JSON.parse creates __proto__ as an own property, unlike an object
      // literal which would invoke the prototype setter
      const params = JSON.parse('{"__proto__":"v","id":"1"}')
      Object.setPrototypeOf(params, { inherited: 'x' })
      const result = applyToParams(v => '' + v, params)
      expect(Object.keys(result).sort()).toEqual(['__proto__', 'id'])
      expect(result.__proto__).toBe('v')
      expect(result.id).toBe('1')
    })
  })
})
