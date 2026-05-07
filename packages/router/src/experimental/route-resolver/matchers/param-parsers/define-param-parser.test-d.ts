import { describe, expectTypeOf, it } from 'vitest'
import {
  defineParamParser,
  defineParamParser2,
  defineQueryParamParser,
} from './define-param-parser'
import type { MatcherQueryParamsValue } from '../matcher-pattern'

describe('defineQueryParamParser', () => {
  it('uses MatcherQueryParamsValue as the URL type', () => {
    const parser = defineQueryParamParser<number>({
      get: value => Number(Array.isArray(value) ? value[0] : value),
      set: value => (value == null ? null : String(value)),
    })

    expectTypeOf(parser.get(undefined)).toEqualTypeOf<number>()
    expectTypeOf(parser.get(null)).toEqualTypeOf<number>()
    expectTypeOf(parser.get('a')).toEqualTypeOf<number>()
    expectTypeOf(parser.get(['a', null])).toEqualTypeOf<number>()
    expectTypeOf(parser.set(3)).toEqualTypeOf<MatcherQueryParamsValue>()

    // @ts-expect-error: number not in MatcherQueryParamsValue
    parser.get(123)
  })

  it('requires both get and set', () => {
    defineQueryParamParser<number>(
      // @ts-expect-error: missing set
      { get: value => Number(value) }
    )
    defineQueryParamParser<number>(
      // @ts-expect-error: missing get
      { set: value => String(value) }
    )
  })
})

describe('defineParamParser', () => {
  it('forces an array-aware TParam', () => {
    const parser = defineParamParser<number>({
      get: value => {
        if (value == null) return null
        if (Array.isArray(value))
          return value.filter(v => v != null).map(Number)
        return Number(value)
      },
      set: value =>
        value == null
          ? null
          : Array.isArray(value)
            ? value.map(String)
            : String(value),
    })

    expectTypeOf(parser.get('a')).toEqualTypeOf<number | number[] | null>()
    expectTypeOf(parser.get(null)).toEqualTypeOf<number | number[] | null>()
    expectTypeOf(parser.get(['a', null])).toEqualTypeOf<
      number | number[] | null
    >()

    expectTypeOf(parser.set(1)).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(parser.set([1, 2])).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(parser.set(null)).toEqualTypeOf<MatcherQueryParamsValue>()

    // @ts-expect-error: undefined not in TParamRaw
    parser.set(undefined)
    // @ts-expect-error: string not in TParamRaw
    parser.set('1')
  })
})

// TODO: rename defineParamParser2 to something better
describe('defineParamParser2', () => {
  const parser = defineParamParser2<Date>({
    get: (value: string | null | undefined): Date | null => {
      if (value == null) return null
      const asDate = new Date(value)
      return Number.isNaN(asDate.getTime()) ? null : asDate
    },
    set: (value: Date | null | undefined): string | null =>
      value == null ? null : value.toISOString(),
  })

  const parserInferred = defineParamParser2<Date>({
    get: value => {
      if (value == null) return null
      const asDate = new Date(value)
      return Number.isNaN(asDate.getTime()) ? null : asDate
    },
    set: value => (value == null ? null : value.toISOString()),
  })

  it('infers the get parameters and return type', () => {
    expectTypeOf(parserInferred.get).toBeCallableWith(null)
    expectTypeOf(parserInferred.get).toBeCallableWith(undefined)
    expectTypeOf(parserInferred.get).toBeCallableWith('hey')
    expectTypeOf(parserInferred.get).toBeCallableWith('')
    expectTypeOf(parserInferred.get).toBeCallableWith([])
    expectTypeOf(parserInferred.get).toBeCallableWith([''])
    expectTypeOf(parserInferred.get).toBeCallableWith(['a', 'b'])
    expectTypeOf(parserInferred.get).toBeCallableWith([null])
    expectTypeOf(parserInferred.get).toBeCallableWith(
      // @ts-expect-error: no numbers
      [2]
    )
    expectTypeOf(parserInferred.get).toBeCallableWith(
      // @ts-expect-error: no numbers
      2
    )

    expectTypeOf(parserInferred.get).returns.toEqualTypeOf<
      Date | Date[] | null
    >()
  })

  it('infers the set parameters and return type', () => {
    expectTypeOf(parserInferred.set).toBeCallableWith(null)
    expectTypeOf(parserInferred.set).toBeCallableWith(undefined)
    expectTypeOf(parserInferred.set).toBeCallableWith(new Date())
    expectTypeOf(parserInferred.set).toBeCallableWith([])
    expectTypeOf(parserInferred.set).toBeCallableWith([new Date()])
    expectTypeOf(parserInferred.set).toBeCallableWith([new Date(), new Date()])
    expectTypeOf(parserInferred.set).toBeCallableWith(
      // @ts-expect-error: no string
      'str'
    )
    expectTypeOf(parserInferred.set).toBeCallableWith(
      // @ts-expect-error: only Date[]
      [null]
    )

    expectTypeOf(parserInferred.get).returns.toEqualTypeOf<
      Date | Date[] | null
    >()
  })

  it('lifts get return type to TParam | TParam[] | null', () => {
    expectTypeOf(parser.get(null)).toEqualTypeOf<Date | Date[] | null>()
    expectTypeOf(parser.get(undefined)).toEqualTypeOf<Date | Date[] | null>()
    expectTypeOf(parser.get('2023-10-01')).toEqualTypeOf<Date | Date[] | null>()
    expectTypeOf(parser.get([])).toEqualTypeOf<Date | Date[] | null>()
    expectTypeOf(parser.get([''])).toEqualTypeOf<Date | Date[] | null>()
    expectTypeOf(parser.get(['2023-10-01', null])).toEqualTypeOf<
      Date | Date[] | null
    >()
  })

  it('lifts set input to TParamRaw | TParamRaw[] | null | undefined', () => {
    expectTypeOf(parser.set(null)).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(parser.set(undefined)).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(
      parser.set(new Date())
    ).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(
      parser.set([new Date()])
    ).toEqualTypeOf<MatcherQueryParamsValue>()
    // null is not part of Date[], only the outer TParamRaw[] union allows arrays of TParamRaw.
    // @ts-expect-error: null inside the array is rejected when TParamRaw = Date
    parser.set([new Date(), null])
  })

  it('rejects invalid call arguments', () => {
    // @ts-expect-error: number not in MatcherQueryParamsValue
    parser.get(123)
    // @ts-expect-error: number not in TParamRaw
    parser.set(123)
    // @ts-expect-error: string not in TParamRaw when TParam = Date
    parser.set('2023-10-01')
  })

  it('supports a distinct TParamRaw', () => {
    const wide = defineParamParser2<Date, Date | string>({
      get: (value: string | null | undefined): Date | null => {
        if (value == null) return null
        const asDate = new Date(value)
        return Number.isNaN(asDate.getTime()) ? null : asDate
      },
      set: (value: Date | string | null | undefined): string | null =>
        value == null
          ? null
          : value instanceof Date
            ? value.toISOString()
            : value,
    })

    expectTypeOf(wide.get(null)).toEqualTypeOf<Date | Date[] | null>()
    expectTypeOf(
      wide.set('2023-10-01')
    ).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(wide.set(new Date())).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(
      wide.set([new Date(), '2023-10-01'])
    ).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(wide.set(null)).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(wide.set(undefined)).toEqualTypeOf<MatcherQueryParamsValue>()

    // @ts-expect-error: number is neither Date nor string
    wide.set(123)
  })

  it('rejects an inner parser with the wrong shape', () => {
    defineParamParser2<Date>({
      // @ts-expect-error: get must return Date | null, not number
      get: () => 1,
      set: () => null,
    })
    defineParamParser2<Date>({
      get: () => null,
      // @ts-expect-error: set must return string | null, not number
      set: () => 1,
    })
  })
})
