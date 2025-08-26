import { describe, expect, it } from 'vitest'
import { PARAM_PARSER_INT } from './integers'

describe('PARAM_PARSER_INT', () => {
  describe('get() - Single Values', () => {
    it('parses valid integer strings', () => {
      expect(PARAM_PARSER_INT.get('0')).toBe(0)
      expect(PARAM_PARSER_INT.get('1')).toBe(1)
      expect(PARAM_PARSER_INT.get('42')).toBe(42)
      expect(PARAM_PARSER_INT.get('-1')).toBe(-1)
      expect(PARAM_PARSER_INT.get('-999')).toBe(-999)
      expect(PARAM_PARSER_INT.get('2147483647')).toBe(2147483647)
    })

    it('parses numbers with leading/trailing whitespace', () => {
      expect(PARAM_PARSER_INT.get(' 42')).toBe(42)
      expect(PARAM_PARSER_INT.get('42 ')).toBe(42)
      expect(PARAM_PARSER_INT.get(' 42 ')).toBe(42)
    })

    it('parses whitespace strings as zero', () => {
      expect(PARAM_PARSER_INT.get(' ')).toBe(0)
      expect(PARAM_PARSER_INT.get('  ')).toBe(0)
      expect(PARAM_PARSER_INT.get('\n')).toBe(0)
      expect(PARAM_PARSER_INT.get('\t')).toBe(0)
    })

    it('parses valid scientific notation as integers', () => {
      expect(PARAM_PARSER_INT.get('1e5')).toBe(100000)
      expect(PARAM_PARSER_INT.get('1e2')).toBe(100)
      expect(PARAM_PARSER_INT.get('2.5e10')).toBe(25000000000)
      expect(PARAM_PARSER_INT.get('1.5e2')).toBe(150)
    })

    it('returns null for null values', () => {
      expect(PARAM_PARSER_INT.get(null)).toBe(null)
    })

    it('throws for decimal numbers', () => {
      expect(() => PARAM_PARSER_INT.get('1.5')).toThrow()
      expect(() => PARAM_PARSER_INT.get('3.14159')).toThrow()
      expect(() => PARAM_PARSER_INT.get('0.1')).toThrow()
      expect(() => PARAM_PARSER_INT.get('-2.5')).toThrow()
    })

    it('throws for scientific notation that results in decimals', () => {
      expect(() => PARAM_PARSER_INT.get('1e-1')).toThrow()
      expect(() => PARAM_PARSER_INT.get('1e-2')).toThrow()
    })

    it('throws for non-numeric strings', () => {
      expect(() => PARAM_PARSER_INT.get('abc')).toThrow()
      expect(() => PARAM_PARSER_INT.get('12abc')).toThrow()
      expect(() => PARAM_PARSER_INT.get('abc12')).toThrow()
      expect(() => PARAM_PARSER_INT.get('true')).toThrow()
      expect(() => PARAM_PARSER_INT.get('false')).toThrow()
      expect(() => PARAM_PARSER_INT.get('NaN')).toThrow()
      expect(() => PARAM_PARSER_INT.get('Infinity')).toThrow()
      expect(() => PARAM_PARSER_INT.get('-Infinity')).toThrow()
    })

    it('throws for empty strings', () => {
      expect(() => PARAM_PARSER_INT.get('')).toThrow()
    })
  })

  describe('get() - Array Values', () => {
    it('parses arrays of valid integer strings', () => {
      expect(PARAM_PARSER_INT.get(['0', '1', '42', '-1', '-999'])).toEqual([
        0, 1, 42, -1, -999,
      ])
      expect(PARAM_PARSER_INT.get(['2147483647'])).toEqual([2147483647])
    })

    it('handles empty arrays', () => {
      expect(PARAM_PARSER_INT.get([])).toEqual([])
    })

    it('throws for arrays with decimal numbers', () => {
      expect(() => PARAM_PARSER_INT.get(['42', '1.5'])).toThrow()
      expect(() => PARAM_PARSER_INT.get(['3.14159'])).toThrow()
    })

    it('throws for arrays with non-numeric strings', () => {
      expect(() => PARAM_PARSER_INT.get(['42', 'invalid'])).toThrow()
      expect(() => PARAM_PARSER_INT.get(['1', '12abc'])).toThrow()
      expect(() => PARAM_PARSER_INT.get(['true', 'false'])).toThrow()
    })

    it('throws for arrays with empty strings', () => {
      expect(() => PARAM_PARSER_INT.get(['1', ''])).toThrow()
      expect(() => PARAM_PARSER_INT.get(['', '2'])).toThrow()
    })

    it('throws for arrays with null values', () => {
      expect(() => PARAM_PARSER_INT.get(['1', null, '3'])).toThrow()
      expect(() => PARAM_PARSER_INT.get([null])).toThrow()
    })
  })

  describe('set() - Single Values', () => {
    it('converts integers to strings', () => {
      expect(PARAM_PARSER_INT.set(0)).toBe('0')
      expect(PARAM_PARSER_INT.set(1)).toBe('1')
      expect(PARAM_PARSER_INT.set(42)).toBe('42')
      expect(PARAM_PARSER_INT.set(-1)).toBe('-1')
      expect(PARAM_PARSER_INT.set(-999)).toBe('-999')
      expect(PARAM_PARSER_INT.set(2147483647)).toBe('2147483647')
    })

    it('returns null for null values', () => {
      expect(PARAM_PARSER_INT.set(null)).toBe(null)
    })
  })

  describe('set() - Array Values', () => {
    it('converts arrays of integers to arrays of strings', () => {
      expect(PARAM_PARSER_INT.set([0, 1, 42, -1, -999])).toEqual([
        '0',
        '1',
        '42',
        '-1',
        '-999',
      ])
      expect(PARAM_PARSER_INT.set([2147483647])).toEqual(['2147483647'])
    })

    it('handles empty arrays', () => {
      expect(PARAM_PARSER_INT.set([])).toEqual([])
    })
  })
})
