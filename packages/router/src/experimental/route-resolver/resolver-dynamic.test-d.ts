import { describe, expectTypeOf, it } from 'vitest'
import { defineComponent } from 'vue'
import { createDynamicResolver } from './resolver-dynamic'
import { MatcherPatternPathStatic } from './matchers/matcher-pattern'
import {
  normalizeRouteRecord,
  type EXPERIMENTAL_RouteRecordNormalized_Matchable,
} from '../router'

const Home = defineComponent({})

describe('createDynamicResolver types', () => {
  it('accepts raw records with string paths or patterns', () => {
    const resolver = createDynamicResolver([
      { name: 'a', path: '/a', components: { default: Home } },
      {
        name: 'b',
        path: new MatcherPatternPathStatic('/b'),
        components: { default: Home },
      },
    ])
    const c = resolver.addRoute({
      name: 'c',
      path: '/c/:id',
      components: { default: Home },
    })
    expectTypeOf(
      c
    ).toEqualTypeOf<EXPERIMENTAL_RouteRecordNormalized_Matchable>()
    resolver.addRoute({
      name: 'c-child',
      path: '/c/:id/child',
      components: { default: Home },
      parent: c,
    })
    // @ts-expect-error: components or redirect is required
    resolver.addRoute({ name: 'd', path: '/d' })
    expectTypeOf(resolver.getRoutes()).toEqualTypeOf<
      EXPERIMENTAL_RouteRecordNormalized_Matchable[]
    >()
    expectTypeOf(resolver.resolve('/a').matched).toEqualTypeOf<
      EXPERIMENTAL_RouteRecordNormalized_Matchable[]
    >()
  })

  it('accepts normalized records', () => {
    const resolver = createDynamicResolver()
    const record = normalizeRouteRecord({
      name: 'a',
      path: new MatcherPatternPathStatic('/a'),
      components: { default: Home },
    })
    expectTypeOf(resolver.addRoute(record)).toEqualTypeOf(record)
    resolver.removeRoute('a')
    resolver.removeRoute(record)
  })

  it('type checks props against the components', () => {
    const User = defineComponent({
      props: { id: { type: Number, required: true } },
    })
    const resolver = createDynamicResolver()
    resolver.addRoute({
      name: 'user',
      path: '/users/:id',
      components: { default: User },
      props: { default: () => ({ id: 1 }) },
    })
    const wrongProps = {
      name: 'user',
      path: '/users/:id',
      components: { default: User },
      props: { default: () => ({ id: 'a' }) },
    }
    // @ts-expect-error: id must be a number
    resolver.addRoute(wrongProps)
  })
})
