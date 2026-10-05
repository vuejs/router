import { expectTypeOf } from 'vitest'
import { definePage } from '../../runtime'
import type { DefinePageHashParamOptions } from '../../runtime'
import { MatcherPatternHashParam } from './matcher-pattern-hash'

const hash = new MatcherPatternHashParam('section', {
  get: (value: string) => ({ heading: value.slice(1) }),
  set: (value: { heading: string }) => `#${value.heading}`,
})

expectTypeOf(hash.match('')).toEqualTypeOf<{
  section: { heading: string } | null
}>()
expectTypeOf(hash.build).parameter(0).toEqualTypeOf<{
  section?: { heading: string } | null | undefined
}>()
hash.build({})
hash.build({ section: null })
hash.build({ section: undefined })

const stringHash = new MatcherPatternHashParam('fragment')
expectTypeOf(stringHash.match('')).toEqualTypeOf<{ fragment: string | null }>()

expectTypeOf<DefinePageHashParamOptions<'int'>['default']>().toEqualTypeOf<
  number | (() => number) | undefined
>()
definePage({
  params: {
    hash: { count: { parser: 'int', required: true } },
  },
})
definePage({
  params: { hash: { section: { default: '#overview' } } },
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
