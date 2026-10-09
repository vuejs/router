import { describe, it, expectTypeOf } from 'vitest'
import type {
  EXPERIMENTAL_Router,
  EXPERIMENTAL_RouterOptions,
} from 'vue-router/experimental'
import {
  definePage,
  normalizeRouteRecord,
  useScrollRestoration,
  MatcherPatternPathStatic,
} from 'vue-router/experimental'
import { useRouter } from 'vue-router'
import { defineComponent, ref, type FunctionalComponent } from 'vue'

// Structural records allow parsed params beyond the classic string constraint.
type ExperimentalRouteRecord<
  Name extends string,
  ParamsRaw,
  Params,
  ChildrenNames extends string = never,
> = {
  name: Name
  path: string
  paramsRaw: ParamsRaw
  params: Params
  childrenNames: ChildrenNames
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
  // id is a path param, page a query param
  user: ExperimentalRouteRecord<
    'user',
    { id: number; page?: number },
    { id: number; page: number }
  >
  users: ExperimentalRouteRecord<'users', {}, {}, 'users-detail'>
  'users-detail': ExperimentalRouteRecord<
    'users-detail',
    { id: number },
    { id: number }
  >
}

type RouteFileInfoMap = {
  'src/pages/user.vue': {
    routes: 'user'
    views: never
    pathParamNames: 'id'
  }
  'src/pages/users.vue': {
    routes: 'users' | 'users-detail'
    views: never
    pathParamNames: never
  }
}

declare module 'vue-router' {
  interface TypesConfig {
    Router: EXPERIMENTAL_Router
    RouteNamedMap: RouteNamedMap
    _RouteFileInfoMap: RouteFileInfoMap
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

describe('route record props', () => {
  const User = defineComponent({
    props: {
      id: { type: Number, required: true },
      page: Number,
      label: String,
    },
  })
  const Aside: FunctionalComponent<{ title: string }> = () => null
  const Search = defineComponent({
    props: { query: { type: String, required: true } },
  })
  const path = new MatcherPatternPathStatic('/')

  it('accepts `true` when the params match the props', () => {
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User },
      props: { default: true },
    })
    // lazy components are unwrapped
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: async () => ({ default: User }) },
      props: { default: true },
    })
  })

  it('rejects `true` when the params do not match the props', () => {
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: Search },
      // @ts-expect-error: params do not contain `query`
      props: { default: true },
    })
    normalizeRouteRecord({
      name: 'users',
      path,
      components: { default: Search },
      // @ts-expect-error: no route passes `query`
      props: { default: true },
    })
  })

  it('types the route location of the function form', () => {
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User },
      props: {
        default: to => {
          expectTypeOf(to.name).toEqualTypeOf<'user'>()
          expectTypeOf(to.params).toEqualTypeOf<{ id: number; page: number }>()
          return { id: to.params.id }
        },
      },
    })
  })

  it('includes the children of the route in the location', () => {
    normalizeRouteRecord({
      name: 'users',
      path,
      components: { default: User },
      props: {
        default: to => {
          expectTypeOf(to.name).toEqualTypeOf<'users' | 'users-detail'>()
          return { id: to.name === 'users-detail' ? to.params.id : 0 }
        },
      },
    })
  })

  it('checks the returned props against the component', () => {
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User },
      props: {
        // @ts-expect-error: id must be a number
        default: to => ({ id: String(to.params.id) }),
      },
    })
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User },
      props: {
        // @ts-expect-error: id is required
        default: () => ({ label: 'a' }),
      },
    })
  })

  it('checks static props against the component', () => {
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User },
      props: { default: { id: 1, label: 'a' } },
    })
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User },
      // @ts-expect-error: id is required
      props: { default: { label: 'a' } },
    })
  })

  it('checks each named view against its component', () => {
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User, aside: Aside },
      props: { default: true, aside: { title: 'a' } },
    })
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User, aside: Aside },
      props: {
        default: true,
        // @ts-expect-error: params do not contain `title`
        aside: true,
      },
    })
    normalizeRouteRecord({
      name: 'user',
      path,
      components: { default: User },
      props: {
        default: true,
        // @ts-expect-error: no `aside` view
        aside: true,
      },
    })
  })

  it('cannot check `true` on records without a typed name', () => {
    normalizeRouteRecord({
      components: { default: Search },
      props: { default: true },
    })
  })
})

describe('definePage props', () => {
  const User = defineComponent({
    props: { id: { type: Number, required: true }, page: Number },
  })
  const Search = defineComponent({
    props: { query: { type: String, required: true } },
  })

  it('accepts anything without the injected types', () => {
    definePage({ props: true })
    definePage({ props: { anything: 1 } })
    definePage({ props: () => ({ anything: 1 }) })
  })

  it('checks `true` against the params of the file routes', () => {
    definePage<'src/pages/user.vue', typeof User>({ props: true })
    definePage<'src/pages/user.vue', typeof Search>({
      // @ts-expect-error: params do not contain `query`
      props: true,
    })
  })

  it('types the route location of the function form', () => {
    definePage<'src/pages/users.vue', typeof User>({
      props: to => {
        expectTypeOf(to.name).toEqualTypeOf<'users' | 'users-detail'>()
        return { id: to.name === 'users-detail' ? to.params.id : 0 }
      },
    })
    definePage<'src/pages/user.vue', typeof User>({
      // @ts-expect-error: id must be a number
      props: to => ({ id: String(to.params.id) }),
    })
  })

  it('checks static props against the component', () => {
    definePage<'src/pages/user.vue', typeof User>({ props: { id: 1 } })
    definePage<'src/pages/user.vue', typeof User>({
      // @ts-expect-error: id is required
      props: { page: 1 },
    })
  })
})
