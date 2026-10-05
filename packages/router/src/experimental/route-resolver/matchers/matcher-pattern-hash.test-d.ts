import { expectTypeOf } from 'vitest'
import { definePage } from '../../runtime'
import type { DefinePageHashParamOptions } from '../../runtime'
import { MatcherPatternHashParam } from './matcher-pattern-hash'

const hash = new MatcherPatternHashParam('section', {
  get: (value: string) => ({ heading: value }),
  set: (value: { heading: string }) => value.heading,
})

expectTypeOf(hash.match('')).toEqualTypeOf<{
  section: { heading: string } | undefined
}>()
expectTypeOf(hash.build).parameter(0).toEqualTypeOf<{
  section?: { heading: string } | undefined
}>()
hash.build({})
// @ts-expect-error: an absent hash uses undefined
hash.build({ section: null })
hash.build({ section: undefined })

const stringHash = new MatcherPatternHashParam('fragment')
expectTypeOf(stringHash.match('')).toEqualTypeOf<{
  fragment: string | undefined
}>()

const nullDefaultHash = new MatcherPatternHashParam(
  'count',
  { get: Number },
  null
)
expectTypeOf(nullDefaultHash.match('')).toEqualTypeOf<{
  count: number | null
}>()
expectTypeOf(nullDefaultHash.build).parameter(0).toEqualTypeOf<{
  count?: number | null | undefined
}>()

const literalDefaultHash = new MatcherPatternHashParam(
  'count',
  { get: Number },
  0,
  true
)
expectTypeOf(literalDefaultHash.match('')).toEqualTypeOf<{
  count: number
}>()

const factoryDefaultHash = new MatcherPatternHashParam(
  'section',
  { get: value => ({ heading: value }) },
  () => ({ heading: 'intro' }),
  true
)
expectTypeOf(factoryDefaultHash.match('')).toEqualTypeOf<{
  section: { heading: string }
}>()
expectTypeOf(factoryDefaultHash.build).parameter(0).toEqualTypeOf<{
  section?: { heading: string } | undefined
}>()

// @ts-expect-error: a numeric parser requires a numeric default
new MatcherPatternHashParam('count', { get: Number }, 'one')
// @ts-expect-error: a numeric parser requires a numeric default factory
new MatcherPatternHashParam('count', { get: Number }, () => 'one')

expectTypeOf<DefinePageHashParamOptions<'int'>['default']>().toEqualTypeOf<
  number | null | (() => number | null) | undefined
>()
definePage({
  params: {
    hash: { count: { parser: 'int', required: true } },
  },
})
definePage({
  params: { hash: { section: { default: 'overview' } } },
})
definePage({
  params: {
    hash: {
      // @ts-expect-error: an int parser requires a numeric default
      count: { parser: 'int', default: 'one' },
    },
  },
})
definePage({
  params: {
    hash: {
      // @ts-expect-error: hash parsers receive the entire string without a query format
      section: { parser: 'string', format: 'array' },
    },
  },
})

definePage({
  params: {
    hash: { count: { parser: 'int', default: () => 1 } },
  },
})
definePage({
  params: {
    hash: { count: { parser: 'int', required: false, default: 1 } },
  },
})
definePage({
  params: {
    hash: {
      // @ts-expect-error: required params cannot have a default value
      count: { parser: 'int', required: true, default: 1 },
    },
  },
})
definePage({
  params: {
    hash: {
      // @ts-expect-error: required params cannot have a default factory
      count: { parser: 'int', required: true, default: () => 1 },
    },
  },
})

definePage({ params: { hash: { section: {} } } })
definePage({ params: { hash: { count: { parser: 'int', default: null } } } })
definePage({
  params: { hash: { count: { parser: 'int', default: () => null } } },
})
definePage({
  params: {
    hash: {
      // @ts-expect-error: required params cannot have a null default
      count: { parser: 'int', required: true, default: null },
    },
  },
})

type ParsedHash = 'intro' | '' | false | 0 | 0n | null | undefined
const falsyParser = { get: (_value: string): ParsedHash => '' }
const parsedHash = new MatcherPatternHashParam('section', falsyParser)
expectTypeOf(parsedHash.match('').section).toEqualTypeOf<ParsedHash>()

const requiredHash = new MatcherPatternHashParam(
  'section',
  falsyParser,
  undefined,
  true
)
expectTypeOf(requiredHash.match('').section).toEqualTypeOf<
  Exclude<ParsedHash, undefined>
>()

const nullableHash = new MatcherPatternHashParam('section', falsyParser, null)
expectTypeOf(nullableHash.match('').section).toEqualTypeOf<
  Exclude<ParsedHash, undefined>
>()

const defaultHash = new MatcherPatternHashParam('section', falsyParser, 'intro')
expectTypeOf(defaultHash.match('').section).toEqualTypeOf<
  Exclude<ParsedHash, undefined>
>()

const requiredStringHash = new MatcherPatternHashParam(
  'fragment',
  {},
  undefined,
  true
)
expectTypeOf(requiredStringHash.match('').fragment).toEqualTypeOf<string>()

const nullableFactoryHash = new MatcherPatternHashParam(
  'count',
  { get: Number },
  () => null
)
expectTypeOf(nullableFactoryHash.match('').count).toEqualTypeOf<number | null>()

const defaultStringHash = new MatcherPatternHashParam('fragment', {}, null)
expectTypeOf(defaultStringHash.match('').fragment).toEqualTypeOf<
  string | null
>()

const undefinedFactoryHash = new MatcherPatternHashParam(
  'section',
  { get: (_value: string): string | undefined => undefined },
  () => undefined
)
expectTypeOf(undefinedFactoryHash.match('').section).toEqualTypeOf<
  string | undefined
>()

const requiredNullableHash = new MatcherPatternHashParam(
  'section',
  { get: (_value: string): string | null => null },
  undefined,
  true
)
expectTypeOf(requiredNullableHash.match('').section).toEqualTypeOf<
  string | null
>()

const nullableParserHash = new MatcherPatternHashParam('section', {
  get: (_value: string): string | null => null,
})
nullableParserHash.build({ section: null })
nullDefaultHash.build({ count: null })
nullableFactoryHash.build({ count: null })
// @ts-expect-error: default strings do not make hash params nullable
stringHash.build({ fragment: null })

expectTypeOf<DefinePageHashParamOptions['default']>().toEqualTypeOf<
  string | null | (() => string | null) | undefined
>()

const implicitStringOptions: DefinePageHashParamOptions = { default: 'intro' }
const explicitIntOptions: DefinePageHashParamOptions<'int'> = {
  parser: 'int',
  default: 0,
}
void implicitStringOptions
void explicitIntOptions
// @ts-expect-error: a non-string parser must be named explicitly
const missingIntParser: DefinePageHashParamOptions<'int'> = { default: 0 }
void missingIntParser

definePage({ params: { hash: { section: { default: () => 'intro' } } } })
definePage({ params: { hash: { section: { default: null } } } })
definePage({ params: { hash: { section: { default: () => null } } } })
definePage({
  params: { hash: { section: { parser: 'string', default: 'intro' } } },
})
definePage({ params: { hash: { count: { parser: 'int', default: 0 } } } })
definePage({ params: { hash: { active: { parser: 'bool', default: false } } } })
definePage({ params: { hash: { count: 'int' } } })

definePage({
  params: {
    hash: {
      // @ts-expect-error: numeric defaults require an explicit parser
      count: { default: 0 },
    },
  },
})
definePage({
  params: {
    hash: {
      // @ts-expect-error: numeric default factories require an explicit parser
      count: { default: () => 0 },
    },
  },
})
definePage({
  params: {
    hash: {
      // @ts-expect-error: boolean defaults require an explicit parser
      active: { default: false },
    },
  },
})
