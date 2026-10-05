import { describe, it, expectTypeOf } from 'vitest'
import type {
  EXPERIMENTAL_Router,
  EXPERIMENTAL_RouterOptions,
} from 'vue-router/experimental'
import { useScrollRestoration } from 'vue-router/experimental'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

// Structural records allow parsed params beyond the classic string constraint.
type ExperimentalRouteRecord<Name extends string, ParamsRaw, Params> = {
  name: Name
  path: string
  paramsRaw: ParamsRaw
  params: Params
  childrenNames: never
}

type RouteNamedMap = {
  'optional-number': ExperimentalRouteRecord<
    'optional-number',
    { id: number | null },
    { id: number | null }
  >
  'optional-string': ExperimentalRouteRecord<
    'optional-string',
    { slug: string | null },
    { slug: string | null }
  >
  'custom-raw': ExperimentalRouteRecord<
    'custom-raw',
    { value: { input: string } },
    { value: number }
  >
}

declare module 'vue-router' {
  interface TypesConfig {
    Router: EXPERIMENTAL_Router
    RouteNamedMap: RouteNamedMap
  }
}

describe('Router conditional via TypesConfig', () => {
  const router = useRouter()
  it('resolves to EXPERIMENTAL_Router when augmented', () => {
    expectTypeOf(router).toEqualTypeOf<EXPERIMENTAL_Router>()
  })

  it('options shape follows the augmented Router', () => {
    expectTypeOf(router.options).toEqualTypeOf<EXPERIMENTAL_RouterOptions>()
  })
})

describe('optional path params', () => {
  const router = useRouter()

  it('accepts numeric values and null', () => {
    router.push({ name: 'optional-number' })
    router.replace({ name: 'optional-number' })
    router.resolve({ name: 'optional-number' })
    router.push({ name: 'optional-number', params: { id: 42 } })
    router.replace({ name: 'optional-number', params: { id: 42 } })
    router.resolve({ name: 'optional-number', params: { id: 42 } })
    router.push({ name: 'optional-number', params: { id: null } })
    router.replace({ name: 'optional-number', params: { id: null } })
    router.resolve({ name: 'optional-number', params: { id: null } })
  })

  it('rejects undefined and empty strings for numeric params', () => {
    // @ts-expect-error: optional numeric params use null, not undefined
    router.push({ name: 'optional-number', params: { id: undefined } })
    // @ts-expect-error: optional numeric params use null, not undefined
    router.replace({ name: 'optional-number', params: { id: undefined } })
    // @ts-expect-error: optional numeric params use null, not undefined
    router.resolve({ name: 'optional-number', params: { id: undefined } })
    // @ts-expect-error: empty strings are not numeric params
    router.push({ name: 'optional-number', params: { id: '' } })
    // @ts-expect-error: empty strings are not numeric params
    router.replace({ name: 'optional-number', params: { id: '' } })
    // @ts-expect-error: empty strings are not numeric params
    router.resolve({ name: 'optional-number', params: { id: '' } })
  })

  it('accepts strings, empty strings, and null', () => {
    router.push({ name: 'optional-string', params: { slug: 'hello' } })
    router.replace({ name: 'optional-string', params: { slug: 'hello' } })
    router.resolve({ name: 'optional-string', params: { slug: 'hello' } })
    router.push({ name: 'optional-string', params: { slug: '' } })
    router.replace({ name: 'optional-string', params: { slug: '' } })
    router.resolve({ name: 'optional-string', params: { slug: '' } })
    router.push({ name: 'optional-string', params: { slug: null } })
    router.replace({ name: 'optional-string', params: { slug: null } })
    router.resolve({ name: 'optional-string', params: { slug: null } })
  })

  it('rejects undefined for string params', () => {
    // @ts-expect-error: optional string params use null, not undefined
    router.push({ name: 'optional-string', params: { slug: undefined } })
    // @ts-expect-error: optional string params use null, not undefined
    router.replace({ name: 'optional-string', params: { slug: undefined } })
    // @ts-expect-error: optional string params use null, not undefined
    router.resolve({ name: 'optional-string', params: { slug: undefined } })
  })
})

describe('custom raw path params', () => {
  const router = useRouter()

  it('accepts the custom input type', () => {
    router.push({ name: 'custom-raw', params: { value: { input: '42' } } })
    router.replace({ name: 'custom-raw', params: { value: { input: '42' } } })
    router.resolve({ name: 'custom-raw', params: { value: { input: '42' } } })
  })

  it('rejects normalized values and automatic null widening', () => {
    // @ts-expect-error: raw parser input does not include undefined
    router.push({ name: 'custom-raw', params: { value: undefined } })
    // @ts-expect-error: raw parser input takes an object, not an empty string
    router.replace({ name: 'custom-raw', params: { value: '' } })
    // @ts-expect-error: the raw parser takes an object, not its numeric output
    router.push({ name: 'custom-raw', params: { value: 42 } })
    // @ts-expect-error: the raw parser takes an object, not its numeric output
    router.replace({ name: 'custom-raw', params: { value: 42 } })
    // @ts-expect-error: the raw parser takes an object, not its numeric output
    router.resolve({ name: 'custom-raw', params: { value: 42 } })
    // @ts-expect-error: raw parser input does not include null
    router.push({ name: 'custom-raw', params: { value: null } })
    // @ts-expect-error: raw parser input does not include null
    router.replace({ name: 'custom-raw', params: { value: null } })
    // @ts-expect-error: raw parser input does not include null
    router.resolve({ name: 'custom-raw', params: { value: null } })
  })
})

describe('useScrollRestoration', () => {
  it('accepts reactive manual options', () => {
    useScrollRestoration({ manual: ref(true) })
    useScrollRestoration({ manual: () => true })
  })
})
