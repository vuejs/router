import { expectTypeOf } from 'vitest'
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
