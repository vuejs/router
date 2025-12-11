import { describe, expect, it } from 'vitest'
import { PARAM_PARSER_BOOL } from './booleans'

describe('PARAM_PARSER_BOOL', () => {
  describe('get() - Single Values', () => {
    it('parses true values', () => {
      expect(PARAM_PARSER_BOOL.get('true')).toBe(true)
      expect(PARAM_PARSER_BOOL.get('TRUE')).toBe(true)
      expect(PARAM_PARSER_BOOL.get('True')).toBe(true)
      expect(PARAM_PARSER_BOOL.get('TrUe')).toBe(true)
      expect(PARAM_PARSER_BOOL.get('tRUE')).toBe(true)
    })

    it('parses false values', () => {
      expect(PARAM_PARSER_BOOL.get('false')).toBe(false)
      expect(PARAM_PARSER_BOOL.get('FALSE')).toBe(false)
      expect(PARAM_PARSER_BOOL.get('False')).toBe(false)
      expect(PARAM_PARSER_BOOL.get('FaLsE')).toBe(false)
      expect(PARAM_PARSER_BOOL.get('fALSE')).toBe(false)
    })

    it('returns true for null values (param present without value)', () => {
      expect(PARAM_PARSER_BOOL.get(null)).toBe(true)
    })

    it('returns undefined for undefined values (param missing)', () => {
      expect(PARAM_PARSER_BOOL.get(undefined)).toBe(undefined)
    })

    it('throws for invalid string values', () => {
      expect(() => PARAM_PARSER_BOOL.get('')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('yes')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('no')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('1')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('0')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('on')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('off')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('maybe')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('invalid')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('true1')).toThrow()
      expect(() => PARAM_PARSER_BOOL.get('falsy')).toThrow()
    })
  })

  describe('get() - Array Values', () => {
    it('parses arrays of valid boolean values', () => {
      expect(PARAM_PARSER_BOOL.get(['true', 'false'])).toEqual([true, false])
      expect(PARAM_PARSER_BOOL.get(['TRUE', 'FALSE'])).toEqual([true, false])
      expect(PARAM_PARSER_BOOL.get(['True', 'False'])).toEqual([true, false])
      expect(PARAM_PARSER_BOOL.get(['true', 'false', 'TRUE', 'FALSE'])).toEqual(
        [true, false, true, false]
      )
    })

    it('handles empty arrays', () => {
      expect(PARAM_PARSER_BOOL.get([])).toEqual([])
    })

    it('handles arrays with null values (converts null to true)', () => {
      expect(PARAM_PARSER_BOOL.get([null])).toEqual([true])
      expect(PARAM_PARSER_BOOL.get(['true', null, 'false'])).toEqual([
        true,
        true,
        false,
      ])
      expect(PARAM_PARSER_BOOL.get([null, null])).toEqual([true, true])
    })

    it('handles mixed arrays with null values correctly', () => {
      expect(PARAM_PARSER_BOOL.get([null, 'true', null])).toEqual([
        true,
        true,
        true,
      ])
      expect(PARAM_PARSER_BOOL.get(['false', null, 'TRUE'])).toEqual([
        false,
        true,
        true,
      ])
      expect(PARAM_PARSER_BOOL.get([null, 'false', null, 'true'])).toEqual([
        true,
        false,
        true,
        true,
      ])
    })

    it('throws for arrays with invalid values', () => {
      expect(() => PARAM_PARSER_BOOL.get(['true', 'invalid'])).toThrow()
      expect(() => PARAM_PARSER_BOOL.get(['invalid'])).toThrow()
      expect(() => PARAM_PARSER_BOOL.get(['true', ''])).toThrow()
      expect(() => PARAM_PARSER_BOOL.get(['yes', 'no'])).toThrow()
    })
  })

  describe('set() - Single Values', () => {
    it('converts boolean values to strings', () => {
      expect(PARAM_PARSER_BOOL.set(true)).toBe('true')
      expect(PARAM_PARSER_BOOL.set(false)).toBe('false')
    })

    it('preserves null values', () => {
      expect(PARAM_PARSER_BOOL.set(null)).toBe(null)
    })

    it('preserves undefined values', () => {
      expect(PARAM_PARSER_BOOL.set(undefined)).toBe(undefined)
    })
  })

  describe('set() - Array Values', () => {
    it('converts arrays of booleans to arrays of strings', () => {
      expect(PARAM_PARSER_BOOL.set([true])).toEqual(['true'])
      expect(PARAM_PARSER_BOOL.set([false])).toEqual(['false'])
      expect(PARAM_PARSER_BOOL.set([true, false])).toEqual(['true', 'false'])
      expect(PARAM_PARSER_BOOL.set([true, false, true])).toEqual([
        'true',
        'false',
        'true',
      ])
    })

    it('handles empty arrays', () => {
      expect(PARAM_PARSER_BOOL.set([])).toEqual([])
    })
  })
})
