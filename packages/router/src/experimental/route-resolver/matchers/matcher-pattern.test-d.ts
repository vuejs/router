import { describe, expectTypeOf, it } from 'vitest'
import {
  MatcherPatternPathCustomParams,
  PARAM_INTEGER,
  PATH_PARAM_DEFAULT_PARSER,
  PATH_PARAM_SINGLE_DEFAULT,
} from './matcher-pattern'

describe('MatcherPatternPathCustomParams', () => {
  it('can be generic', () => {
    const matcher = new MatcherPatternPathCustomParams(
      /^\/users\/([^/]+)$/i,
      { userId: { parser: PATH_PARAM_DEFAULT_PARSER } },
      ['users', 0]
    )

    expectTypeOf(matcher.match('/users/123')).toEqualTypeOf<{
      userId: string | string[] | null
    }>()

    expectTypeOf(matcher.build({ userId: '123' })).toEqualTypeOf<string>()
    expectTypeOf(matcher.build({ userId: ['123'] })).toEqualTypeOf<string>()
    expectTypeOf(matcher.build({ userId: null })).toEqualTypeOf<string>()

    matcher.build(
      // @ts-expect-error: missing userId param
      {}
    )
    matcher.build(
      // @ts-expect-error: wrong param
      { other: '123' }
    )
  })

  it('can be a simple param', () => {
    const matcher = new MatcherPatternPathCustomParams(
      /^\/users\/([^/]+)\/([^/]+)$/i,
      { userId: { parser: PATH_PARAM_SINGLE_DEFAULT, repeat: true } },
      ['users', 0]
    )
    expectTypeOf(matcher.match('/users/123/456')).toEqualTypeOf<{
      userId: string
    }>()

    expectTypeOf(matcher.build({ userId: '123' })).toEqualTypeOf<string>()

    // @ts-expect-error: must be a string
    matcher.build({ userId: ['123'] })
    // @ts-expect-error: missing userId param
    matcher.build({})
  })

  it('can be a custom type', () => {
    const matcher = new MatcherPatternPathCustomParams(
      /^\/profiles\/([^/]+)$/i,
      {
        userId: {
          parser: PARAM_INTEGER,
          // parser: PATH_PARAM_DEFAULT_PARSER,
        },
      },
      ['profiles', 0]
    )

    expectTypeOf(matcher.match('/profiles/2')).toEqualTypeOf<{
      userId: number
    }>()

    expectTypeOf(matcher.build({ userId: 2 })).toEqualTypeOf<string>()

    // @ts-expect-error: must be a number
    matcher.build({ userId: '2' })
    // @ts-expect-error: missing userId param
    matcher.build({})
  })
})
