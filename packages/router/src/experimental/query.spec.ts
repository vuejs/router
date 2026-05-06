import { mockWarn } from '../../__tests__/vitest-mock-warn'
import {
  experimental_parseQuery as parseQuery,
  experimental_normalizeQuery as normalizeQuery,
} from './query'
import { describe, expect, it } from 'vitest'

describe('parseQuery', () => {
  mockWarn()

  it('works with leading ?', () => {
    expect(parseQuery('?foo=a')).toEqual({
      foo: 'a',
    })
    expect(parseQuery('foo=a')).toEqual({
      foo: 'a',
    })
    expect(parseQuery('?')).toEqual({})
  })

  it('works with an empty string', () => {
    const emptyQuery = parseQuery('')
    expect(Object.keys(emptyQuery)).toHaveLength(0)
    expect(emptyQuery).toEqual({})
    expect(parseQuery('?')).toEqual({})
  })

  it('decodes values in query', () => {
    expect(parseQuery('e=%25')).toEqual({
      e: '%',
    })
  })

  it('parses empty string values', () => {
    expect(parseQuery('e=&c=a')).toEqual({
      e: '',
      c: 'a',
    })
  })

  it('allows = inside values', () => {
    expect(parseQuery('e=c=a')).toEqual({
      e: 'c=a',
    })
  })

  it('parses empty values as null', () => {
    expect(parseQuery('e&b&c=a')).toEqual({
      e: null,
      b: null,
      c: 'a',
    })
  })

  it('parses empty values as null in arrays', () => {
    expect(parseQuery('e&e&e=a')).toEqual({
      e: [null, null, 'a'],
    })
  })

  it('decodes array values in query', () => {
    expect(parseQuery('e=%25&e=%22')).toEqual({
      e: ['%', '"'],
    })
    expect(parseQuery('e=%25&e=a')).toEqual({
      e: ['%', 'a'],
    })
  })

  it('decodes the + as space', () => {
    expect(parseQuery('a+b=c+d')).toEqual({
      'a b': 'c d',
    })
  })

  it('decodes the encoded + as +', () => {
    expect(parseQuery('a%2Bb=c%2Bd')).toEqual({
      'a+b': 'c+d',
    })
  })

  // this is for browsers like IE that allow invalid characters
  it('keep invalid values as is', () => {
    expect(parseQuery('e=%&e=%25')).toEqual({
      e: ['%', '%'],
    })

    expect('decoding "%"').toHaveBeenWarnedTimes(1)
  })

  it('does not pollute the prototype with __proto__', () => {
    expect(Object.getPrototypeOf(parseQuery(''))).toBe(null)
    expect(Object.getPrototypeOf(parseQuery('?'))).toBe(null)
  })

  it('does not pollute the prototype with __proto__', () => {
    const result = parseQuery('__proto__=polluted') as Record<string, unknown>
    expect(Object.getPrototypeOf(result)).toBe(null)
    expect(result['__proto__']).toBe('polluted')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('treats constructor as a regular key', () => {
    const result = parseQuery('constructor=foo')
    expect(Object.getPrototypeOf(result)).toBe(null)
    expect(result).toEqual({ constructor: 'foo' })
    expect(Object.prototype.constructor).toBe(Object)
  })
})

describe('normalizeQuery', () => {
  it('removes keys with undefined values', () => {
    expect(normalizeQuery({ a: undefined, b: 'x' })).toEqual({ b: 'x' })
  })

  it('preserves null values', () => {
    expect(normalizeQuery({ a: null })).toEqual({ a: null })
  })

  it('coerces numbers to strings', () => {
    expect(normalizeQuery({ a: 1 })).toEqual({ a: '1' })
  })

  it('preserves string values', () => {
    expect(normalizeQuery({ a: 'x' })).toEqual({ a: 'x' })
  })

  it('coerces values inside arrays', () => {
    expect(normalizeQuery({ a: [1, 'x', null] })).toEqual({
      a: ['1', 'x', null],
    })
  })

  it('replaces undefined with null inside arrays', () => {
    expect(normalizeQuery({ a: [undefined, 'x'] })).toEqual({
      a: [null, 'x'],
    })
  })

  it('handles empty / undefined input', () => {
    expect(normalizeQuery(undefined)).toEqual({})
    expect(normalizeQuery({})).toEqual({})
  })

  it('returns a null-prototype object', () => {
    expect(Object.getPrototypeOf(normalizeQuery({ a: 'x' }))).toBe(null)
    expect(Object.getPrototypeOf(normalizeQuery({}))).toBe(null)
    expect(Object.getPrototypeOf(normalizeQuery(undefined))).toBe(null)
  })
})
