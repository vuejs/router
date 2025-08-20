import { describe, expect, it } from 'vitest'
import { MatcherPatternQueryParam } from './matcher-pattern-query'
import {
  PARAM_PARSER_INT,
  PARAM_PARSER_BOOL,
  PARAM_PARSER_DEFAULTS,
} from './param-parsers'
import { MatchMiss } from './errors'

describe('MatcherPatternQueryParam', () => {
  describe('match() - format: value', () => {
    it('extracts single string value', () => {
      const matcher = new MatcherPatternQueryParam(
        'userId',
        'user_id',
        'value',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ user_id: 'abc123' })).toEqual({ userId: 'abc123' })
    })

    it('takes first value from array', () => {
      const matcher = new MatcherPatternQueryParam(
        'userId',
        'user_id',
        'value',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ user_id: ['first', 'second'] })).toEqual({
        userId: 'first',
      })
    })

    it('handles null value', () => {
      const matcher = new MatcherPatternQueryParam(
        'userId',
        'user_id',
        'value',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ user_id: null })).toEqual({ userId: null })
    })

    it('handles missing query param', () => {
      const matcher = new MatcherPatternQueryParam(
        'userId',
        'user_id',
        'value',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({})).toEqual({
        userId: undefined,
      })
    })
  })

  describe('match() - format: array', () => {
    it('extracts array value', () => {
      const matcher = new MatcherPatternQueryParam(
        'tags',
        'tag',
        'array',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ tag: ['vue', 'router'] })).toEqual({
        tags: ['vue', 'router'],
      })
    })

    it('converts single value to array', () => {
      const matcher = new MatcherPatternQueryParam(
        'tags',
        'tag',
        'array',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ tag: 'vue' })).toEqual({ tags: ['vue'] })
    })

    it('handles null in array format', () => {
      const matcher = new MatcherPatternQueryParam(
        'tags',
        'tag',
        'array',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ tag: null })).toEqual({ tags: [] })
    })

    it('handles missing query', () => {
      const matcher = new MatcherPatternQueryParam(
        'tags',
        'tag',
        'array',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({})).toEqual({ tags: [] })
    })
  })

  describe('match() - format: both', () => {
    it('preserves single string value', () => {
      const matcher = new MatcherPatternQueryParam(
        'data',
        'value',
        'both',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ value: 'single' })).toEqual({ data: 'single' })
    })

    it('preserves array value', () => {
      const matcher = new MatcherPatternQueryParam(
        'data',
        'values',
        'both',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ values: ['a', 'b'] })).toEqual({
        data: ['a', 'b'],
      })
    })

    it('preserves null', () => {
      const matcher = new MatcherPatternQueryParam(
        'data',
        'value',
        'both',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ value: null })).toEqual({ data: null })
    })

    it('handles missing query param', () => {
      const matcher = new MatcherPatternQueryParam(
        'data',
        'value',
        'both',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({})).toEqual({ data: undefined })
    })
  })

  describe('build()', () => {
    describe('format: value', () => {
      it('builds query from single value', () => {
        const matcher = new MatcherPatternQueryParam(
          'userId',
          'user_id',
          'value',
          PARAM_PARSER_DEFAULTS
        )
        expect(matcher.build({ userId: 'abc123' })).toEqual({
          user_id: 'abc123',
        })
      })

      it('builds query from null value', () => {
        const matcher = new MatcherPatternQueryParam(
          'userId',
          'user_id',
          'value',
          PARAM_PARSER_DEFAULTS
        )
        expect(matcher.build({ userId: null })).toEqual({ user_id: null })
      })

      it('strips off und efined values', () => {
        const matcher = new MatcherPatternQueryParam(
          'userId',
          'user_id',
          'value',
          PARAM_PARSER_DEFAULTS
        )
        // @ts-expect-error: not sure if this should be allowed
        expect(matcher.build({})).toEqual({})
        // @ts-expect-error: not sure if this should be allowed
        expect(matcher.build({ userId: undefined })).toEqual({})
      })
    })

    describe('format: array', () => {
      it('builds query from array value', () => {
        const matcher = new MatcherPatternQueryParam(
          'tags',
          'tag',
          'array',
          PARAM_PARSER_DEFAULTS
        )
        expect(matcher.build({ tags: ['vue', 'router'] })).toEqual({
          tag: ['vue', 'router'],
        })
      })

      it('builds query from single value as array', () => {
        const matcher = new MatcherPatternQueryParam(
          'tags',
          'tag',
          'array',
          PARAM_PARSER_DEFAULTS
        )
        expect(matcher.build({ tags: ['vue'] })).toEqual({ tag: ['vue'] })
      })
    })

    describe('format: both', () => {
      it('builds query from single value', () => {
        const matcher = new MatcherPatternQueryParam(
          'data',
          'value',
          'both',
          PARAM_PARSER_DEFAULTS
        )
        expect(matcher.build({ data: 'single' })).toEqual({ value: 'single' })
      })

      it('builds query from array value', () => {
        const matcher = new MatcherPatternQueryParam(
          'data',
          'values',
          'both',
          PARAM_PARSER_DEFAULTS
        )
        expect(matcher.build({ data: ['a', 'b'] })).toEqual({
          values: ['a', 'b'],
        })
      })

      it('builds query from null value', () => {
        const matcher = new MatcherPatternQueryParam(
          'data',
          'value',
          'both',
          PARAM_PARSER_DEFAULTS
        )
        expect(matcher.build({ data: null })).toEqual({ value: null })
      })
    })
  })

  describe('default values', () => {
    it('uses function default value when query param missing', () => {
      const matcher = new MatcherPatternQueryParam(
        'page',
        'p',
        'value',
        PARAM_PARSER_DEFAULTS,
        () => '1'
      )
      expect(matcher.match({})).toEqual({ page: '1' })
    })

    it('uses static default value', () => {
      const matcher = new MatcherPatternQueryParam(
        'limit',
        'l',
        'value',
        PARAM_PARSER_DEFAULTS,
        '10'
      )
      expect(matcher.match({})).toEqual({ limit: '10' })
    })

    it('prefers actual value over default', () => {
      const matcher = new MatcherPatternQueryParam(
        'page',
        'p',
        'value',
        PARAM_PARSER_DEFAULTS,
        '1'
      )
      expect(matcher.match({ p: '5' })).toEqual({ page: '5' })
    })
  })

  describe('parser integration', () => {
    it('can use custom PARAM_PARSER_INT for numbers', () => {
      const matcher = new MatcherPatternQueryParam(
        'count',
        'c',
        'value',
        PARAM_PARSER_INT
      )
      expect(matcher.match({ c: '42' })).toEqual({ count: 42 })
      expect(matcher.build({ count: 42 })).toEqual({ c: '42' })
    })

    it('throws on error without default', () => {
      const matcher = new MatcherPatternQueryParam(
        'count',
        'c',
        'value',
        PARAM_PARSER_INT
      )
      expect(() => matcher.match({ c: 'invalid' })).toThrow(MatchMiss)
    })

    it('falls back to default on parser error', () => {
      const matcher = new MatcherPatternQueryParam(
        'count',
        'c',
        'value',
        PARAM_PARSER_INT,
        0
      )
      expect(matcher.match({ c: 'invalid' })).toEqual({ count: 0 })
    })

    it('can use PARAM_PARSER_BOOL for booleans', () => {
      const matcher = new MatcherPatternQueryParam(
        'enabled',
        'e',
        'value',
        PARAM_PARSER_BOOL
      )

      expect(matcher.match({ e: 'true' })).toEqual({ enabled: true })
      expect(matcher.match({ e: 'false' })).toEqual({ enabled: false })
      expect(matcher.build({ enabled: false })).toEqual({ e: 'false' })
      expect(matcher.build({ enabled: true })).toEqual({ e: 'true' })
    })
  })

  describe('missing query parameters', () => {
    it('returns undefined when query param missing with parser and no default', () => {
      const matcher = new MatcherPatternQueryParam(
        'count',
        'c',
        'value',
        PARAM_PARSER_INT
      )
      expect(matcher.match({ other: 'value' })).toEqual({ count: undefined })
    })

    it('uses default when query param missing', () => {
      const matcher = new MatcherPatternQueryParam(
        'optional',
        'opt',
        'value',
        PARAM_PARSER_DEFAULTS,
        'fallback'
      )
      expect(matcher.match({})).toEqual({ optional: 'fallback' })
    })

    it('uses function default when query param missing', () => {
      const matcher = new MatcherPatternQueryParam(
        'timestamp',
        'ts',
        'value',
        PARAM_PARSER_INT,
        () => 0
      )
      expect(matcher.match({})).toEqual({ timestamp: 0 })
    })

    it('uses default when query param missing in array format', () => {
      const matcher = new MatcherPatternQueryParam(
        'items',
        'item',
        'array',
        PARAM_PARSER_DEFAULTS,
        ['a']
      )
      expect(matcher.match({})).toEqual({ items: ['a'] })
    })
  })

  describe('edge cases', () => {
    it('handles empty array', () => {
      const matcher = new MatcherPatternQueryParam(
        'items',
        'item',
        'array',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ item: [] })).toEqual({ items: [] })
    })

    it('filters out null values in arrays', () => {
      const matcher = new MatcherPatternQueryParam(
        'ids',
        'id',
        'array',
        PARAM_PARSER_INT,
        () => []
      )
      expect(matcher.match({ id: ['1', null, '3'] })).toEqual({ ids: [1, 3] })
    })

    it('handles undefined query param with default', () => {
      const matcher = new MatcherPatternQueryParam(
        'missing',
        'miss',
        'value',
        PARAM_PARSER_DEFAULTS,
        'default'
      )
      expect(matcher.match({ other: 'value' })).toEqual({ missing: 'default' })
    })
  })

  describe('defaultValue', () => {
    describe('match', () => {
      it('should fallback to PARAM_PARSER_DEFAULTS.get when parser.get is undefined', () => {
        const matcher = new MatcherPatternQueryParam(
          'test',
          'test_param',
          'value',
          {}
        )
        // Should use PARAM_PARSER_DEFAULTS.get which returns value ?? null
        expect(matcher.match({ test_param: 'value' })).toEqual({
          test: 'value',
        })
        expect(matcher.match({ test_param: null })).toEqual({ test: null })
        expect(matcher.match({})).toEqual({ test: undefined })
      })

      it('should handle array format with missing get method', () => {
        const matcher = new MatcherPatternQueryParam(
          'test',
          'test_param',
          'array',
          {}
        )
        // Should use PARAM_PARSER_DEFAULTS.get which returns value ?? null
        expect(matcher.match({ test_param: ['a', 'b'] })).toEqual({
          test: ['a', 'b'],
        })
        expect(matcher.match({ test_param: 'single' })).toEqual({
          test: ['single'],
        })
      })

      it('should handle both format with missing get method', () => {
        const matcher = new MatcherPatternQueryParam(
          'test',
          'test_param',
          'both',
          {}
        )
        // Should use PARAM_PARSER_DEFAULTS.get which returns value ?? null
        expect(matcher.match({ test_param: 'value' })).toEqual({
          test: 'value',
        })
        expect(matcher.match({ test_param: ['a', 'b'] })).toEqual({
          test: ['a', 'b'],
        })
      })
    })

    describe('build', () => {
      it('should fallback to PARAM_PARSER_DEFAULTS.set when parser.set is undefined', () => {
        const matcher = new MatcherPatternQueryParam(
          'test',
          'test_param',
          'value',
          {}
        )
        // Should use PARAM_PARSER_DEFAULTS.set which converts to string
        expect(matcher.build({ test: 'value' })).toEqual({
          test_param: 'value',
        })
        expect(matcher.build({ test: 123 })).toEqual({ test_param: '123' })
        expect(matcher.build({ test: true })).toEqual({ test_param: 'true' })
        expect(matcher.build({ test: null })).toEqual({ test_param: null })
        expect(matcher.build({ test: undefined })).toEqual({})
      })

      it('should handle array values with missing set method', () => {
        const matcher = new MatcherPatternQueryParam(
          'test',
          'test_param',
          'array',
          {}
        )
        // Should use PARAM_PARSER_DEFAULTS.set which handles arrays
        expect(matcher.build({ test: ['a', 'b'] })).toEqual({
          test_param: ['a', 'b'],
        })
        expect(matcher.build({ test: [1, 2] })).toEqual({
          test_param: ['1', '2'],
        })
        expect(matcher.build({ test: [1, true] })).toEqual({
          test_param: ['1', 'true'],
        })
      })

      it('should handle both format with missing set method', () => {
        const matcher = new MatcherPatternQueryParam(
          'test',
          'test_param',
          'both',
          {}
        )
        // Should use PARAM_PARSER_DEFAULTS.set
        expect(matcher.build({ test: 'value' })).toEqual({
          test_param: 'value',
        })
        expect(matcher.build({ test: ['a', 'b'] })).toEqual({
          test_param: ['a', 'b'],
        })
      })
    })
  })
})
