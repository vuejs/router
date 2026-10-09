/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import {
  experimental_createRouter,
  normalizeRouteRecord,
  type EXPERIMENTAL_RouteRecordNormalized_Matchable,
} from './router'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './route-resolver/matchers/matcher-pattern'
import { MatcherPatternQueryParam } from './route-resolver/matchers/matcher-pattern-query'
import { PARAM_PARSER_INT } from './route-resolver/matchers/param-parsers'
import { _mergeRouteRecordViews } from './runtime'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'

enableAutoUnmount(afterEach)

const User = defineComponent({
  props: {
    id: { type: Number, required: true },
    page: { type: Number, default: 0 },
    label: String,
  },
  setup: props => () =>
    h(
      'p',
      `${typeof props.id}:${props.id} page:${props.page} label:${props.label}`
    ),
})

const Aside = defineComponent({
  props: { title: String },
  setup: props => () => h('aside', `title:${props.title}`),
})

const userPath = new MatcherPatternPathDynamic(
  /^\/users\/([^/]+?)$/i,
  { id: [PARAM_PARSER_INT] },
  ['users', 1]
)
const pageQuery = [
  new MatcherPatternQueryParam('page', 'page', 'value', PARAM_PARSER_INT, 1),
]

async function mountRouter(
  ...records: EXPERIMENTAL_RouteRecordNormalized_Matchable[]
) {
  const router = experimental_createRouter({
    history: createMemoryHistory(),
    resolver: createFixedResolver([
      ...records,
      normalizeRouteRecord({
        name: 'start',
        path: new MatcherPatternPathStatic('/'),
        components: {},
      }),
    ]),
  })
  await router.push('/')
  const wrapper = mount(
    defineComponent({
      components: { RouterView },
      template: `<RouterView /><RouterView name="aside" />`,
    }),
    { global: { plugins: [router] } }
  )
  return { router, wrapper }
}

describe('Experimental route record props', () => {
  it('passes parsed params as props with `true`', async () => {
    const { router, wrapper } = await mountRouter(
      normalizeRouteRecord({
        name: 'user',
        path: userPath,
        query: pageQuery,
        components: { default: User },
        props: { default: true },
      })
    )
    await router.push('/users/42?page=3')
    await flushPromises()
    expect(wrapper.text()).toBe('number:42 page:3 label:undefined')
  })

  it('passes the result of a function', async () => {
    const { router, wrapper } = await mountRouter(
      normalizeRouteRecord({
        name: 'user',
        path: userPath,
        components: { default: User },
        props: {
          default: to => ({ id: Number(to.params.id) * 2, label: 'fn' }),
        },
      })
    )
    await router.push('/users/7')
    await flushPromises()
    expect(wrapper.text()).toBe('number:14 page:0 label:fn')
  })

  it('passes props to each named view', async () => {
    const { router, wrapper } = await mountRouter(
      normalizeRouteRecord({
        name: 'user',
        path: userPath,
        components: { default: User, aside: Aside },
        props: { default: true, aside: { title: 'static' } },
      })
    )
    await router.push('/users/1')
    await flushPromises()
    expect(wrapper.find('p').text()).toBe('number:1 page:0 label:undefined')
    expect(wrapper.find('aside').text()).toBe('title:static')
  })

  it('passes no params to views without props', async () => {
    const { router, wrapper } = await mountRouter(
      normalizeRouteRecord({
        name: 'user',
        path: userPath,
        components: { default: User, aside: Aside },
        props: { default: true },
      })
    )
    await router.push('/users/1')
    await flushPromises()
    expect(wrapper.find('aside').text()).toBe('title:undefined')
  })

  it('passes definePage() props to the view of the page', async () => {
    const { router, wrapper } = await mountRouter(
      normalizeRouteRecord(
        _mergeRouteRecordViews(
          {
            name: 'user',
            path: userPath,
            components: { default: User, aside: Aside },
          },
          {
            default: { props: true },
            aside: { props: to => ({ title: `user ${to.params.id}` }) },
          }
        )
      )
    )
    await router.push('/users/5')
    await flushPromises()
    expect(wrapper.find('p').text()).toBe('number:5 page:0 label:undefined')
    expect(wrapper.find('aside').text()).toBe('title:user 5')
  })
})

describe('_mergeRouteRecordViews', () => {
  it('sets the props of each page on its view', () => {
    const record = _mergeRouteRecordViews(
      { meta: {}, props: {} },
      {
        default: { props: true },
        aside: { props: { title: 'a' } },
      }
    )
    expect(record.props).toEqual({ default: true, aside: { title: 'a' } })
  })

  it('merges meta of all the pages', () => {
    const record = _mergeRouteRecordViews(
      { meta: { a: 1 } },
      {
        default: { meta: { b: 2 } },
        aside: { meta: { c: 3 } },
      }
    )
    expect(record.meta).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('keeps the properties extracted at build time', () => {
    const path = new MatcherPatternPathStatic('/about')
    const record = _mergeRouteRecordViews(
      { name: '/about', path },
      {
        default: {
          name: 'custom',
          path: '/custom',
          alias: ['/other'],
          params: { query: { page: 'int' } },
        },
      }
    )
    expect(record).toEqual({ name: '/about', path })
  })

  it('keeps other properties of the page', () => {
    const redirect = () => '/'
    const record = _mergeRouteRecordViews({}, { default: { redirect } })
    expect(record).toEqual({ redirect })
  })
})
