import { describe, expectTypeOf, it } from 'vitest'
import { defineParamParserRaw, defineParamParser } from './define-param-parser'
import type { MatcherQueryParamsValue } from '../matcher-pattern'
import { miss } from '../errors'

describe('defineParamParserRaw', () => {
  it('uses MatcherQueryParamsValue as the URL type', () => {
    const parser = defineParamParserRaw<number>({
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
    defineParamParserRaw<number>(
      // @ts-expect-error: missing set
      { get: value => Number(value) }
    )
    defineParamParserRaw<number>(
      // @ts-expect-error: missing get
      { set: value => String(value) }
    )
  })

  it('keeps TParam as-is without lifting to array/null', () => {
    const parser = defineParamParserRaw<Set<string>>({
      get: value => {
        const asArray = (Array.isArray(value) ? value : [value]).filter(
          v => v != null
        )
        return new Set(asArray)
      },
      set: value => [...value],
    })

    expectTypeOf(parser.get('a')).toEqualTypeOf<Set<string>>()
    expectTypeOf(parser.get(null)).toEqualTypeOf<Set<string>>()
    expectTypeOf(parser.get(['a', null])).toEqualTypeOf<Set<string>>()

    expectTypeOf(
      parser.set(new Set<string>())
    ).toEqualTypeOf<MatcherQueryParamsValue>()

    // @ts-expect-error: array of strings is not Set<string>
    parser.set(['a'])
    // @ts-expect-error: string is not Set<string>
    parser.set('1')
    // @ts-expect-error: null is not Set<string>
    parser.set(null)
  })

  it('supports a wider TParamRaw', () => {
    const parser = defineParamParserRaw<Set<string>, Set<string> | string[]>({
      get: value => {
        const asArray = (Array.isArray(value) ? value : [value]).filter(
          v => v != null
        )
        return new Set(asArray)
      },
      set: value => (Array.isArray(value) ? value : [...value]),
    })

    expectTypeOf(
      parser.set(new Set<string>())
    ).toEqualTypeOf<MatcherQueryParamsValue>()
    expectTypeOf(
      parser.set(['a', 'b'])
    ).toEqualTypeOf<MatcherQueryParamsValue>()

    // @ts-expect-error: number not in TParamRaw
    parser.set(1)
  })
})

describe('defineParamParser', () => {
  const parser = defineParamParser<Date>({
    get: (value: string): Date => {
      const asDate = new Date(value)
      return Number.isNaN(asDate.getTime()) ? miss('not a date') : asDate
    },
    set: (value: Date): string => value.toISOString(),
  })

  const parserInferred = defineParamParser<Date>({
    get: value => {
      const asDate = new Date(value)
      return Number.isNaN(asDate.getTime()) ? miss('not a date') : asDate
    },
    set: value => value.toISOString(),
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
    const wide = defineParamParser<Date, Date | string>({
      get: (value: string): Date => {
        const asDate = new Date(value)
        return Number.isNaN(asDate.getTime()) ? miss('not a date') : asDate
      },
      set: (value: Date | string): string =>
        value instanceof Date ? value.toISOString() : value,
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
    defineParamParser<Date>({
      // @ts-expect-error: get must return Date, not number
      get: () => 1,
      set: () => '',
    })
    defineParamParser<Date>({
      get: () => new Date(),
      // @ts-expect-error: set must return string, not number
      set: () => 1,
    })
  })
})
