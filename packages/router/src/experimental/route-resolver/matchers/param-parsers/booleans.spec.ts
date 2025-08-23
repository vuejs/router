import { describe, expect, it } from 'vitest'
import {
  PARAM_BOOLEAN_SINGLE,
  PARAM_BOOLEAN_OPTIONAL,
  PARAM_BOOLEAN_REPEATABLE,
  PARAM_BOOLEAN_REPEATABLE_OPTIONAL,
  PARAM_PARSER_BOOL,
} from './booleans'

describe('PARAM_BOOLEAN_SINGLE', () => {
  describe('get()', () => {
    it('parses true values', () => {
      expect(PARAM_BOOLEAN_SINGLE.get('true')).toBe(true)
      expect(PARAM_BOOLEAN_SINGLE.get('TRUE')).toBe(true)
      expect(PARAM_BOOLEAN_SINGLE.get('True')).toBe(true)
    })

    it('parses false values', () => {
      expect(PARAM_BOOLEAN_SINGLE.get('false')).toBe(false)
      expect(PARAM_BOOLEAN_SINGLE.get('FALSE')).toBe(false)
      expect(PARAM_BOOLEAN_SINGLE.get('False')).toBe(false)
    })

    it('throws for invalid values', () => {
      expect(() => PARAM_BOOLEAN_SINGLE.get('yes')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('no')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('1')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('0')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('on')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('off')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('maybe')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('invalid')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('true1')).toThrow()
      expect(() => PARAM_BOOLEAN_SINGLE.get('falsy')).toThrow()
    })

    it('returns false for null or empty values', () => {
      expect(PARAM_BOOLEAN_SINGLE.get(null)).toBe(false)
      expect(PARAM_BOOLEAN_SINGLE.get('')).toBe(false)
    })
  })

  describe('set()', () => {
    it('converts boolean to string', () => {
      expect(PARAM_BOOLEAN_SINGLE.set(true)).toBe('true')
      expect(PARAM_BOOLEAN_SINGLE.set(false)).toBe('false')
    })

    it('converts null to false string', () => {
      expect(PARAM_BOOLEAN_SINGLE.set(null)).toBe('false')
    })
  })
})

describe('PARAM_BOOLEAN_OPTIONAL', () => {
  describe('get()', () => {
    it('returns null for null input', () => {
      expect(PARAM_BOOLEAN_OPTIONAL.get(null)).toBe(null)
    })

    it('parses valid values', () => {
      expect(PARAM_BOOLEAN_OPTIONAL.get('true')).toBe(true)
      expect(PARAM_BOOLEAN_OPTIONAL.get('false')).toBe(false)
    })

    it('throws for invalid values', () => {
      expect(() => PARAM_BOOLEAN_OPTIONAL.get('invalid')).toThrow()
    })
  })

  describe('set()', () => {
    it('returns null for null input', () => {
      expect(PARAM_BOOLEAN_OPTIONAL.set(null)).toBe(null)
    })

    it('converts boolean to string', () => {
      expect(PARAM_BOOLEAN_OPTIONAL.set(true)).toBe('true')
      expect(PARAM_BOOLEAN_OPTIONAL.set(false)).toBe('false')
    })
  })
})

describe('PARAM_BOOLEAN_REPEATABLE', () => {
  describe('get()', () => {
    it('parses array of boolean values', () => {
      expect(
        PARAM_BOOLEAN_REPEATABLE.get(['true', 'false', 'TRUE', 'FALSE'])
      ).toEqual([true, false, true, false])
    })

    it('throws for invalid values in array', () => {
      expect(() => PARAM_BOOLEAN_REPEATABLE.get(['true', 'invalid'])).toThrow()
    })
  })

  describe('set()', () => {
    it('converts array of booleans to strings', () => {
      expect(PARAM_BOOLEAN_REPEATABLE.set([true, false, true])).toEqual([
        'true',
        'false',
        'true',
      ])
    })
  })
})

describe('PARAM_PARSER_BOOL', () => {
  describe('get()', () => {
    it('handles single values', () => {
      expect(PARAM_PARSER_BOOL.get('true')).toBe(true)
      expect(PARAM_PARSER_BOOL.get('false')).toBe(false)
    })

    it('handles null values', () => {
      expect(PARAM_PARSER_BOOL.get(null)).toBe(false)
    })

    it('handles array values', () => {
      expect(PARAM_PARSER_BOOL.get(['true', 'false'])).toEqual([true, false])
    })
  })

  describe('set()', () => {
    it('handles single values', () => {
      expect(PARAM_PARSER_BOOL.set(true)).toBe('true')
      expect(PARAM_PARSER_BOOL.set(false)).toBe('false')
    })

    it('handles null values', () => {
      expect(PARAM_PARSER_BOOL.set(null)).toBe('false')
    })

    it('handles array values', () => {
      expect(PARAM_PARSER_BOOL.set([true, false])).toEqual(['true', 'false'])
    })
  })
})
