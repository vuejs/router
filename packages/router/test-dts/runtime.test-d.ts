import { describe, it, expectTypeOf } from 'vitest'
import type {
  DefinePageQueryParamOptions,
  ParamParserTypeOf,
} from '../src/experimental/runtime'
import { definePage } from '../src/experimental/runtime'

declare module '../src/config' {
  interface TypesConfig {
    _ParamParsers: {
      date: { type: Date }
      // registered name with no `type` field — should resolve to `unknown`
      orphan: {}
    }
  }
}

describe('definePage', () => {
  describe('ParamParserTypeOf', () => {
    it('resolves native parsers', () => {
      expectTypeOf<ParamParserTypeOf<'int'>>().toEqualTypeOf<number>()
      expectTypeOf<ParamParserTypeOf<'bool'>>().toEqualTypeOf<boolean>()
    })

    it('resolves an augmented custom parser', () => {
      expectTypeOf<ParamParserTypeOf<'date'>>().toEqualTypeOf<Date>()
    })

    it('falls back to unknown for a parser name with no type augmentation', () => {
      expectTypeOf<ParamParserTypeOf<'orphan'>>().toEqualTypeOf<unknown>()
    })

    it('distributes over a union of parser names', () => {
      expectTypeOf<ParamParserTypeOf<'int' | 'date'>>().toEqualTypeOf<
        number | Date
      >()
      expectTypeOf<ParamParserTypeOf<'int' | 'bool'>>().toEqualTypeOf<
        number | boolean
      >()
    })
  })

  describe('query params default (interface form)', () => {
    it('infers number for the int native parser', () => {
      expectTypeOf<
        Required<DefinePageQueryParamOptions<'int'>>['default']
      >().toEqualTypeOf<(() => number) | number>()
    })

    it('infers boolean for the bool native parser', () => {
      expectTypeOf<
        Required<DefinePageQueryParamOptions<'bool'>>['default']
      >().toEqualTypeOf<(() => boolean) | boolean>()
    })

    it('resolves the augmented type for a custom parser', () => {
      expectTypeOf<
        Required<DefinePageQueryParamOptions<'date'>>['default']
      >().toEqualTypeOf<(() => Date) | Date>()
    })
  })

  describe('query params default (record literal)', () => {
    it('narrows `default` per parser via the distributive variant', () => {
      definePage({
        params: {
          query: {
            page: { parser: 'int', default: 1 },
            pageFn: { parser: 'int', default: () => 1 },
            flag: { parser: 'bool', default: false },
            flagFn: { parser: 'bool', default: () => true },
            when: { parser: 'date', default: new Date() },
            whenFn: { parser: 'date', default: () => new Date() },
            orphan: { parser: 'orphan', default: 'anything' satisfies unknown },
          },
        },
      })
    })

    it('accepts the shorthand string form for an unparsed entry', () => {
      definePage({
        params: {
          query: {
            page: 'int',
            flag: 'bool',
            when: 'date',
          },
        },
      })
    })

    it('rejects a default value not assignable to the parser type', () => {
      definePage({
        params: {
          query: {
            // @ts-expect-error: string is not a number
            page: { parser: 'int', default: 'one' },
          },
        },
      })

      definePage({
        params: {
          query: {
            // @ts-expect-error: function must return number, not string
            page: { parser: 'int', default: () => 'one' },
          },
        },
      })

      definePage({
        params: {
          query: {
            // @ts-expect-error: number is not a boolean
            flag: { parser: 'bool', default: 1 },
          },
        },
      })

      definePage({
        params: {
          query: {
            // @ts-expect-error: string is not Date for the augmented `date` parser
            when: { parser: 'date', default: 'today' },
          },
        },
      })
    })
  })
})
