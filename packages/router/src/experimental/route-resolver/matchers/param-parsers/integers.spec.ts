import { describe, expect, it } from 'vitest'
import {
  PARAM_INTEGER_SINGLE,
  PARAM_INTEGER_OPTIONAL,
  PARAM_INTEGER_REPEATABLE,
  PARAM_INTEGER_REPEATABLE_OPTIONAL,
  PARAM_PARSER_INT,
} from './integers'

describe('PARAM_INTEGER_SINGLE', () => {
  describe('get()', () => {
    it('parses valid integers', () => {
      expect(PARAM_INTEGER_SINGLE.get('0')).toBe(0)
      expect(PARAM_INTEGER_SINGLE.get('1')).toBe(1)
      expect(PARAM_INTEGER_SINGLE.get('42')).toBe(42)
      expect(PARAM_INTEGER_SINGLE.get('-1')).toBe(-1)
      expect(PARAM_INTEGER_SINGLE.get('-999')).toBe(-999)
      expect(PARAM_INTEGER_SINGLE.get('2147483647')).toBe(2147483647)
    })

    it('throws for decimal numbers', () => {
      expect(() => PARAM_INTEGER_SINGLE.get('1.5')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('3.14159')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('0.1')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('-2.5')).toThrow()
    })

    it('throws for non-numeric strings', () => {
      expect(() => PARAM_INTEGER_SINGLE.get('abc')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('12abc')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('abc12')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('true')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('false')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('NaN')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('Infinity')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('-Infinity')).toThrow()
    })

    it('throws for empty strings', () => {
      expect(() => PARAM_INTEGER_SINGLE.get('')).toThrow()
    })

    it('parses whitespace strings as zero', () => {
      expect(PARAM_INTEGER_SINGLE.get(' ')).toBe(0)
      expect(PARAM_INTEGER_SINGLE.get('  ')).toBe(0)
      expect(PARAM_INTEGER_SINGLE.get('\n')).toBe(0)
      expect(PARAM_INTEGER_SINGLE.get('\t')).toBe(0)
    })

    it('throws for null', () => {
      expect(() => PARAM_INTEGER_SINGLE.get(null)).toThrow()
    })

    it('parses numbers with leading/trailing whitespace', () => {
      expect(PARAM_INTEGER_SINGLE.get(' 42')).toBe(42)
      expect(PARAM_INTEGER_SINGLE.get('42 ')).toBe(42)
      expect(PARAM_INTEGER_SINGLE.get(' 42 ')).toBe(42)
    })

    it('parses valid scientific notation as integers', () => {
      expect(PARAM_INTEGER_SINGLE.get('1e5')).toBe(100000)
      expect(PARAM_INTEGER_SINGLE.get('1e2')).toBe(100)
    })

    it('parses scientific notation that results in large integers', () => {
      expect(PARAM_INTEGER_SINGLE.get('2.5e10')).toBe(25000000000)
      expect(PARAM_INTEGER_SINGLE.get('1.5e2')).toBe(150)
    })

    it('throws for scientific notation that results in decimals', () => {
      expect(() => PARAM_INTEGER_SINGLE.get('1e-1')).toThrow()
      expect(() => PARAM_INTEGER_SINGLE.get('1e-2')).toThrow()
    })
  })

  describe('set()', () => {
    it('converts integers to strings', () => {
      expect(PARAM_INTEGER_SINGLE.set(0)).toBe('0')
      expect(PARAM_INTEGER_SINGLE.set(1)).toBe('1')
      expect(PARAM_INTEGER_SINGLE.set(42)).toBe('42')
      expect(PARAM_INTEGER_SINGLE.set(-1)).toBe('-1')
      expect(PARAM_INTEGER_SINGLE.set(-999)).toBe('-999')
      expect(PARAM_INTEGER_SINGLE.set(2147483647)).toBe('2147483647')
    })
  })
})

describe('PARAM_INTEGER_OPTIONAL', () => {
  describe('get()', () => {
    it('returns null for null input', () => {
      expect(PARAM_INTEGER_OPTIONAL.get(null)).toBe(null)
    })

    it('parses valid integers', () => {
      expect(PARAM_INTEGER_OPTIONAL.get('0')).toBe(0)
      expect(PARAM_INTEGER_OPTIONAL.get('42')).toBe(42)
      expect(PARAM_INTEGER_OPTIONAL.get('-1')).toBe(-1)
    })

    it('throws for invalid values', () => {
      expect(() => PARAM_INTEGER_OPTIONAL.get('invalid')).toThrow()
      expect(() => PARAM_INTEGER_OPTIONAL.get('1.5')).toThrow()
      expect(() => PARAM_INTEGER_OPTIONAL.get('')).toThrow()
    })
  })

  describe('set()', () => {
    it('returns null for null input', () => {
      expect(PARAM_INTEGER_OPTIONAL.set(null)).toBe(null)
    })

    it('converts integers to strings', () => {
      expect(PARAM_INTEGER_OPTIONAL.set(0)).toBe('0')
      expect(PARAM_INTEGER_OPTIONAL.set(42)).toBe('42')
      expect(PARAM_INTEGER_OPTIONAL.set(-1)).toBe('-1')
    })
  })
})

describe('PARAM_INTEGER_REPEATABLE', () => {
  describe('get()', () => {
    it('parses array of integer values', () => {
      expect(
        PARAM_INTEGER_REPEATABLE.get(['0', '1', '42', '-1', '-999'])
      ).toEqual([0, 1, 42, -1, -999])
    })

    it('handles empty array', () => {
      expect(PARAM_INTEGER_REPEATABLE.get([])).toEqual([])
    })

    it('throws for invalid values in array', () => {
      expect(() => PARAM_INTEGER_REPEATABLE.get(['42', 'invalid'])).toThrow()
      expect(() => PARAM_INTEGER_REPEATABLE.get(['1', '2.5'])).toThrow()
      expect(() => PARAM_INTEGER_REPEATABLE.get(['1', ''])).toThrow()
    })

    it('throws if any element is null', () => {
      expect(() => PARAM_INTEGER_REPEATABLE.get(['1', null, '3'])).toThrow()
    })
  })

  describe('set()', () => {
    it('converts array of integers to strings', () => {
      expect(PARAM_INTEGER_REPEATABLE.set([0, 1, 42, -1, -999])).toEqual([
        '0',
        '1',
        '42',
        '-1',
        '-999',
      ])
    })

    it('handles empty array', () => {
      expect(PARAM_INTEGER_REPEATABLE.set([])).toEqual([])
    })
  })
})

describe('PARAM_INTEGER_REPEATABLE_OPTIONAL', () => {
  describe('get()', () => {
    it('returns null for null input', () => {
      expect(PARAM_INTEGER_REPEATABLE_OPTIONAL.get(null)).toBe(null)
    })

    it('parses array of integer values', () => {
      expect(PARAM_INTEGER_REPEATABLE_OPTIONAL.get(['0', '42', '-1'])).toEqual([
        0, 42, -1,
      ])
    })

    it('handles empty array', () => {
      expect(PARAM_INTEGER_REPEATABLE_OPTIONAL.get([])).toEqual([])
    })

    it('throws for invalid values in array', () => {
      expect(() =>
        PARAM_INTEGER_REPEATABLE_OPTIONAL.get(['42', 'invalid'])
      ).toThrow()
    })
  })

  describe('set()', () => {
    it('returns null for null input', () => {
      expect(PARAM_INTEGER_REPEATABLE_OPTIONAL.set(null)).toBe(null)
    })

    it('converts array of integers to strings', () => {
      expect(PARAM_INTEGER_REPEATABLE_OPTIONAL.set([0, 42, -1])).toEqual([
        '0',
        '42',
        '-1',
      ])
    })

    it('handles empty array', () => {
      expect(PARAM_INTEGER_REPEATABLE_OPTIONAL.set([])).toEqual([])
    })
  })
})

describe('PARAM_PARSER_INT', () => {
  describe('get()', () => {
    it('handles single integer values', () => {
      expect(PARAM_PARSER_INT.get('0')).toBe(0)
      expect(PARAM_PARSER_INT.get('42')).toBe(42)
      expect(PARAM_PARSER_INT.get('-1')).toBe(-1)
    })

    it('handles null values', () => {
      expect(PARAM_PARSER_INT.get(null)).toBe(null)
    })

    it('handles array values', () => {
      expect(PARAM_PARSER_INT.get(['0', '42', '-1'])).toEqual([0, 42, -1])
      expect(PARAM_PARSER_INT.get([])).toEqual([])
    })

    it('throws for invalid single values', () => {
      expect(() => PARAM_PARSER_INT.get('invalid')).toThrow()
      expect(() => PARAM_PARSER_INT.get('1.5')).toThrow()
    })

    it('throws for invalid array values', () => {
      expect(() => PARAM_PARSER_INT.get(['1', 'invalid'])).toThrow()
      expect(() => PARAM_PARSER_INT.get(['1', '2.5'])).toThrow()
    })
  })

  describe('set()', () => {
    it('handles single integer values', () => {
      expect(PARAM_PARSER_INT.set(0)).toBe('0')
      expect(PARAM_PARSER_INT.set(42)).toBe('42')
      expect(PARAM_PARSER_INT.set(-1)).toBe('-1')
    })

    it('handles null values', () => {
      expect(PARAM_PARSER_INT.set(null)).toBe(null)
    })

    it('handles array values', () => {
      expect(PARAM_PARSER_INT.set([0, 42, -1])).toEqual(['0', '42', '-1'])
      expect(PARAM_PARSER_INT.set([])).toEqual([])
    })
  })
})
