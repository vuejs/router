import { describe, expect, it } from 'vitest'
import { _mergeRouteRecord } from './runtime'
import {
  normalizeRouteRecord,
  type EXPERIMENTAL_RouteRecord_Matchable,
} from './router'
import type { RouteRecordRaw } from '../types'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import { NO_MATCH_LOCATION } from './route-resolver/resolver-abstract'
import { MatcherPatternPathStatic } from './route-resolver/matchers/matcher-pattern'

describe('_mergeRouteRecord', () => {
  it('keeps the path matcher of a resolver record when definePage has a path', () => {
    // shape of the generated vue-router/auto-resolver code with a ?definePage import
    const merged = _mergeRouteRecord(
      // resolver records have a matcher as path
      {
        name: '/users',
        path: new MatcherPatternPathStatic('/users'),
        components: { default: {} },
      } as unknown as RouteRecordRaw,
      { path: '/people', meta: { requiresAuth: true } }
    ) as unknown as EXPERIMENTAL_RouteRecord_Matchable
    const record = normalizeRouteRecord(merged)
    const resolver = createFixedResolver([record])

    expect(resolver.resolve({ path: '/users' })).toMatchObject({
      name: '/users',
      path: '/users',
      matched: [{ meta: { requiresAuth: true } }],
    })
    expect(resolver.resolve({ name: '/users', params: {} })).toMatchObject({
      path: '/users',
    })
    expect(resolver.resolve({ path: '/people' })).toMatchObject({
      ...NO_MATCH_LOCATION,
      path: '/people',
    })
  })

  it('merges a string path into a regular route record', () => {
    const main: RouteRecordRaw = { path: '/users', component: {} }
    const definePageData: Partial<RouteRecordRaw> = {
      path: '/people',
      meta: { requiresAuth: true },
    }
    expect(_mergeRouteRecord(main, definePageData)).toMatchObject({
      path: '/people',
      meta: { requiresAuth: true },
    })
  })
})
