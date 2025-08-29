import { describe, expect, it } from 'vitest'
import { PARAM_PARSER_STRING } from './strings'
import { MatchMiss } from '../errors'

describe('PARAM_PARSER_STRING', () => {
  describe('get() - Single Values', () => {
    it('returns string values as-is', () => {
      expect(PARAM_PARSER_STRING.get('hello')).toBe('hello')
      expect(PARAM_PARSER_STRING.get('world')).toBe('world')
      expect(PARAM_PARSER_STRING.get('123')).toBe('123')
      expect(PARAM_PARSER_STRING.get('true')).toBe('true')
      expect(PARAM_PARSER_STRING.get('')).toBe('')
    })

    it('returns empty string for null values', () => {
      expect(PARAM_PARSER_STRING.get(null)).toBe('')
    })

    it('returns empty string for undefined values', () => {
      expect(PARAM_PARSER_STRING.get(undefined)).toBe('')
    })
  })

  describe('get() - Array Values', () => {
    it('returns arrays of strings as-is', () => {
      expect(PARAM_PARSER_STRING.get(['hello', 'world'])).toEqual([
        'hello',
        'world',
      ])
      expect(PARAM_PARSER_STRING.get(['one', 'two', 'three'])).toEqual([
        'one',
        'two',
        'three',
      ])
      expect(PARAM_PARSER_STRING.get(['123', 'true', 'false'])).toEqual([
        '123',
        'true',
        'false',
      ])
    })

    it('handles empty arrays', () => {
      expect(PARAM_PARSER_STRING.get([])).toEqual([])
    })

    it('handles arrays with special characters', () => {
      expect(PARAM_PARSER_STRING.get(['hello world', 'foo-bar'])).toEqual([
        'hello world',
        'foo-bar',
      ])
      expect(
        PARAM_PARSER_STRING.get(['hello@world.com', '!@#$%^&*()'])
      ).toEqual(['hello@world.com', '!@#$%^&*()'])
    })

    it('handles arrays with empty strings', () => {
      expect(PARAM_PARSER_STRING.get(['', 'hello', ''])).toEqual([
        '',
        'hello',
        '',
      ])
      expect(PARAM_PARSER_STRING.get([''])).toEqual([''])
    })

    it('filters out null values from arrays', () => {
      expect(PARAM_PARSER_STRING.get(['hello', null, 'world'])).toEqual([
        'hello',
        'world',
      ])
      expect(PARAM_PARSER_STRING.get([null])).toEqual([])
      expect(PARAM_PARSER_STRING.get(['foo', null, null, 'bar'])).toEqual([
        'foo',
        'bar',
      ])
      expect(PARAM_PARSER_STRING.get([null, null])).toEqual([])
    })

    it('handles mixed arrays with null values', () => {
      expect(
        PARAM_PARSER_STRING.get([null, 'hello', null, 'world', null])
      ).toEqual(['hello', 'world'])
      expect(PARAM_PARSER_STRING.get(['first', null, '', 'last'])).toEqual([
        'first',
        '',
        'last',
      ])
    })
  })

  describe('set() - Single Values', () => {
    it('converts values to strings', () => {
      expect(PARAM_PARSER_STRING.set('hello')).toBe('hello')
      expect(PARAM_PARSER_STRING.set('world')).toBe('world')
      expect(PARAM_PARSER_STRING.set('')).toBe('')
    })

    it('returns an empty string for null values', () => {
      expect(PARAM_PARSER_STRING.set(null)).toBe('')
    })

    // NOTE: undefined is not allowed as input to set() per the type definition
    // it('returns an empty string for undefined values', () => {
    //   expect(PARAM_PARSER_STRING.set(undefined)).toBe('')
    // })
  })

  describe('set() - Array Values', () => {
    it('converts arrays of strings to arrays of strings', () => {
      expect(PARAM_PARSER_STRING.set(['hello', 'world'])).toEqual([
        'hello',
        'world',
      ])
      expect(PARAM_PARSER_STRING.set(['one', 'two', 'three'])).toEqual([
        'one',
        'two',
        'three',
      ])
    })

    it('handles empty arrays', () => {
      expect(PARAM_PARSER_STRING.set([])).toEqual([])
    })

    it('handles arrays with empty strings', () => {
      expect(PARAM_PARSER_STRING.set(['', 'hello', ''])).toEqual([
        '',
        'hello',
        '',
      ])
      expect(PARAM_PARSER_STRING.set([''])).toEqual([''])
    })

    it('handles arrays with special characters', () => {
      expect(PARAM_PARSER_STRING.set(['hello world', 'foo-bar'])).toEqual([
        'hello world',
        'foo-bar',
      ])
      expect(
        PARAM_PARSER_STRING.set(['hello@world.com', '!@#$%^&*()'])
      ).toEqual(['hello@world.com', '!@#$%^&*()'])
    })
  })
})
