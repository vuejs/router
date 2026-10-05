import { describe, expectTypeOf, it } from 'vitest'
import { defineHashParamParser } from '../../../index'

describe('defineHashParamParser', () => {
  it('infers the parsed type and uses strings for the URL', () => {
    const parser = defineHashParamParser({
      get: value => {
        expectTypeOf(value).toEqualTypeOf<string>()
        return value.split('/')
      },
      set: value => {
        expectTypeOf(value).toEqualTypeOf<string[]>()
        return value.join('/')
      },
    })

    expectTypeOf(parser.get('')).toEqualTypeOf<string[]>()
    expectTypeOf(parser.set(['intro'])).toEqualTypeOf<string>()
    expectTypeOf(parser.get).parameter(0).toEqualTypeOf<string>()
    expectTypeOf(parser.set).parameter(0).toEqualTypeOf<string[]>()
  })

  it('supports explicit parsed and raw types', () => {
    const parser = defineHashParamParser<number, number | string>({
      get: value => Number(value),
      set: value => String(value),
    })

    expectTypeOf(parser.get('1')).toEqualTypeOf<number>()
    expectTypeOf(parser.set).parameter(0).toEqualTypeOf<number | string>()
    expectTypeOf(parser.set(1)).toEqualTypeOf<string>()
    expectTypeOf(parser.set('1')).toEqualTypeOf<string>()
  })

  it('requires both get and set with string URL values', () => {
    // @ts-expect-error: missing set
    defineHashParamParser<number>({ get: Number })
    // @ts-expect-error: missing get
    defineHashParamParser<number>({ set: String })
    defineHashParamParser<number>({
      get: Number,
      // @ts-expect-error: the setter must return a string
      set: value => [String(value)],
    })
    defineHashParamParser<number>({
      get: Number,
      // @ts-expect-error: the setter must not return null
      set: () => null,
    })
  })
})
