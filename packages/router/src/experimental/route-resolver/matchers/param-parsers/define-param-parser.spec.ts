import { describe, expect, it, vi } from 'vitest'
import { defineParamParser } from './define-param-parser'
import { miss } from '../errors'

describe('defineParamParser', () => {
  describe('get() - Single Values', () => {
    it('returns null for null without calling inner get', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get(null)).toBe(null)
      expect(get).not.toHaveBeenCalled()
    })

    it('returns null for undefined without calling inner get', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get(undefined)).toBe(null)
      expect(get).not.toHaveBeenCalled()
    })

    it('forwards string values to inner get exactly once', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get('hello')).toBe(5)
      expect(get).toHaveBeenCalledTimes(1)
      expect(get).toHaveBeenCalledWith('hello')
    })

    it('forwards empty strings to inner get', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get('')).toBe(0)
      expect(get).toHaveBeenCalledTimes(1)
      expect(get).toHaveBeenCalledWith('')
    })

    it('propagates errors thrown by inner get', () => {
      const parser = defineParamParser<number>({
        get: value => {
          const num = Number(value)
          return Number.isNaN(num) ? miss(`not a number: ${value}`) : num
        },
        set: value => String(value),
      })

      expect(() => parser.get('abc')).toThrow()
    })
  })

  describe('get() - Array Values', () => {
    it('returns empty array for empty array without calling inner get', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get([])).toEqual([])
      expect(get).not.toHaveBeenCalled()
    })

    it('forwards each array entry to inner get in order', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get(['a', 'bb', 'ccc'])).toEqual([1, 2, 3])
      expect(get).toHaveBeenCalledTimes(3)
      // we only care about the first argument of each call, map() also passes the index and whole array
      // so we can't use toHaveBeenNthCalledWith
      expect(get.mock.calls.map(args => args[0])).toEqual(['a', 'bb', 'ccc'])
    })

    it('filters out null entries before calling inner get', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get(['a', null, 'bb', null])).toEqual([1, 2])
      expect(get).toHaveBeenCalledTimes(2)
      expect(get.mock.calls.map(args => args[0])).toEqual(['a', 'bb'])
    })

    it('returns empty array when every entry is null without calling inner get', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.get([null, null])).toEqual([])
      expect(get).not.toHaveBeenCalled()
    })
  })

  describe('set() - Single Values', () => {
    it('returns null for null without calling inner set', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.set(null)).toBe(null)
      expect(set).not.toHaveBeenCalled()
    })

    it('returns undefined for undefined without calling inner set', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.set(undefined)).toBe(undefined)
      expect(set).not.toHaveBeenCalled()
    })

    it('forwards values to inner set exactly once', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.set(42)).toBe('42')
      expect(set).toHaveBeenCalledTimes(1)
      expect(set).toHaveBeenCalledWith(42)
    })

    it('forwards falsy non-nullish values to inner set', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.set(0)).toBe('0')
      expect(set).toHaveBeenCalledTimes(1)
      expect(set).toHaveBeenCalledWith(0)
    })
  })

  describe('set() - Array Values', () => {
    it('returns empty array for empty array without calling inner set', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.set([])).toEqual([])
      expect(set).not.toHaveBeenCalled()
    })

    it('forwards each array entry to inner set in order', () => {
      const get = vi.fn((v: string) => v.length)
      const set = vi.fn((v: number) => String(v))
      const parser = defineParamParser<number>({ get, set })

      expect(parser.set([1, 2, 3])).toEqual(['1', '2', '3'])
      expect(set).toHaveBeenCalledTimes(3)
      expect(set.mock.calls.map(args => args[0])).toEqual([1, 2, 3])
    })
  })

  it('composes a Number-based parser end-to-end', () => {
    const parser = defineParamParser<number>({
      get: value => {
        const num = Number(value)
        return Number.isNaN(num) ? miss(`not a number: ${value}`) : num
      },
      set: value => String(value),
    })

    expect(parser.get('1')).toBe(1)
    expect(parser.get(['1', '2'])).toEqual([1, 2])
    expect(parser.get(['1', null, '2'])).toEqual([1, 2])
    expect(parser.get(null)).toBe(null)
    expect(parser.get(undefined)).toBe(null)

    expect(parser.set(1)).toBe('1')
    expect(parser.set([1, 2])).toEqual(['1', '2'])
    expect(parser.set(null)).toBe(null)
    expect(parser.set(undefined)).toBe(undefined)
    expect(() => parser.get('abc')).toThrow()
  })
})
