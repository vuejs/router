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

    it('takes last value from array', () => {
      const matcher = new MatcherPatternQueryParam(
        'userId',
        'user_id',
        'value',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({ user_id: ['first', 'second'] })).toEqual({
        userId: 'second',
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

    it('lets the parser handle null values', () => {
      expect(
        new MatcherPatternQueryParam(
          'active',
          'a',
          'value',
          // transforms null to true
          PARAM_PARSER_BOOL,
          false
        ).match({ a: null })
      ).toEqual({ active: true })

      expect(
        new MatcherPatternQueryParam(
          'active',
          'a',
          'value',
          // this leavs the value as null
          PARAM_PARSER_DEFAULTS,
          'ko'
        ).match({ a: null })
      ).toEqual({ active: null })
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
    it('handles missing query param with default', () => {
      const matcher = new MatcherPatternQueryParam(
        'userId',
        'user_id',
        'value',
        PARAM_PARSER_DEFAULTS,
        'default'
      )
      expect(matcher.match({})).toEqual({
        userId: 'default',
      })
    })

    it('returns undefined for missing optional param without default', () => {
      const matcher = new MatcherPatternQueryParam(
        'userId',
        'user_id',
        'value',
        PARAM_PARSER_DEFAULTS
      )
      expect(matcher.match({})).toEqual({ userId: undefined })
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

  describe('required parameter', () => {
    it('throws MatchMiss for required: true when param is missing', () => {
      const matcher = new MatcherPatternQueryParam(
        'requiredParam',
        'req',
        'value',
        PARAM_PARSER_DEFAULTS,
        undefined,
        true
      )
      expect(() => matcher.match({})).toThrow(MatchMiss)
    })

    it('uses actual value when required: true and param exists', () => {
      const matcher = new MatcherPatternQueryParam(
        'requiredParam',
        'req',
        'value',
        PARAM_PARSER_DEFAULTS,
        undefined,
        true
      )
      expect(matcher.match({ req: 'value' })).toEqual({
        requiredParam: 'value',
      })
    })

    it('uses default over required (default takes precedence)', () => {
      const matcher = new MatcherPatternQueryParam(
        'param',
        'p',
        'value',
        PARAM_PARSER_DEFAULTS,
        'default',
        true
      )
      // Even with required: true, default should be used if param is missing
      expect(matcher.match({})).toEqual({ param: 'default' })
    })

    it('throws MatchMiss for required: true with invalid parser value', () => {
      const matcher = new MatcherPatternQueryParam(
        'count',
        'c',
        'value',
        PARAM_PARSER_INT,
        undefined,
        true
      )
      // Parser throws on invalid value, should propagate
      expect(() => matcher.match({ c: 'invalid' })).toThrow(MatchMiss)
    })

    it('falls back to default on parser error even when required', () => {
      const matcher = new MatcherPatternQueryParam(
        'count',
        'c',
        'value',
        PARAM_PARSER_INT,
        0, // default value
        true // required
      )
      // Invalid value should fallback to default instead of throwing
      expect(matcher.match({ c: 'invalid' })).toEqual({ count: 0 })
    })

    it('returns empty array for missing optional param with array format', () => {
      const matcher = new MatcherPatternQueryParam(
        'items',
        'item',
        'array',
        PARAM_PARSER_DEFAULTS,
        undefined,
        false
      )
      // Array format with missing param returns [], not undefined
      expect(matcher.match({})).toEqual({ items: [] })
    })

    it('returns empty array for required: true with array format (parsed value is [])', () => {
      const matcher = new MatcherPatternQueryParam(
        'items',
        'item',
        'array',
        PARAM_PARSER_DEFAULTS,
        undefined,
        true
      )
      // Array format normalizes missing query param to [] *before* the parser runs.
      // Since [] is a valid parsed value (not undefined), required: true doesn't trigger.
      // This is expected behavior - array format treats missing as "empty array".
      expect(matcher.match({})).toEqual({ items: [] })
    })

    it('handles null value differently from missing value with required: true', () => {
      const matcher = new MatcherPatternQueryParam(
        'param',
        'p',
        'value',
        PARAM_PARSER_DEFAULTS,
        undefined,
        true
      )
      // null is a valid value, not missing
      expect(matcher.match({ p: null })).toEqual({ param: null })
      // missing throws
      expect(() => matcher.match({})).toThrow(MatchMiss)
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

    it('integer parser filters out null values in arrays', () => {
      const matcher = new MatcherPatternQueryParam(
        'ids',
        'id',
        'array',
        PARAM_PARSER_INT
      )
      // Integer parser filters out null values from arrays
      expect(matcher.match({ id: ['1', null, '3'] })).toEqual({
        ids: [1, 3],
      })
    })

    it('integer parser with default also filters null values', () => {
      const matcher = new MatcherPatternQueryParam(
        'ids',
        'id',
        'array',
        PARAM_PARSER_INT,
        () => []
      )
      // Integer parser filters null values even with default
      expect(matcher.match({ id: ['1', null, '3'] })).toEqual({
        ids: [1, 3],
      })
    })

    it('passes null values to boolean parser in arrays', () => {
      const matcher = new MatcherPatternQueryParam(
        'flags',
        'flag',
        'array',
        PARAM_PARSER_BOOL
      )
      // Now that null filtering is removed, null values get passed to parser
      expect(matcher.match({ flag: ['true', null, 'false'] })).toEqual({
        flags: [true, true, false],
      })
    })

    it('handles null values with default parser in arrays', () => {
      const matcher = new MatcherPatternQueryParam(
        'values',
        'value',
        'array',
        PARAM_PARSER_DEFAULTS
      )
      // Now that null filtering is removed, null values get passed to parser
      expect(matcher.match({ value: ['a', null, 'b'] })).toEqual({
        values: ['a', null, 'b'],
      })
    })
  })

  it('should work without parser parameter', () => {
    const matcher = new MatcherPatternQueryParam('test', 'test_param', 'value')
    // Should use PARAM_PARSER_DEFAULTS.get which returns value ?? null
    expect(matcher.match({ test_param: 'value' })).toEqual({
      test: 'value',
    })
    expect(matcher.build({ test: 'value' })).toEqual({
      test_param: 'value',
    })
  })

  describe('parser fallback', () => {
    describe('match', () => {
      it('should fallback to PARAM_PARSER_DEFAULTS.get when parser.get is undefined', () => {
        const matcher = new MatcherPatternQueryParam(
          'test',
          'test_param',
          'value',
          {},
          'default'
        )
        // Should use PARAM_PARSER_DEFAULTS.get which returns value ?? null
        expect(matcher.match({ test_param: 'value' })).toEqual({
          test: 'value',
        })
        expect(matcher.match({ test_param: null })).toEqual({ test: null })
        expect(matcher.match({})).toEqual({ test: 'default' })
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
    })
  })
})
