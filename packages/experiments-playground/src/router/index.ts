import { createWebHistory } from 'vue-router'
import {
  experimental_createRouter,
  createStaticResolver,
  MatcherPatternPathStatic,
  normalizeRouteRecord,
} from 'vue-router/experimental'
import type {
  EXPERIMENTAL_RouteRecordNormalized_Matchable,
  MatcherPatternHash,
  MatcherPatternQuery,
} from 'vue-router/experimental'
import PageHome from '../pages/(home).vue'

// type ExtractMatcherQueryParams<T> =
//   T extends MatcherPatternQuery<infer P> ? P : never

// type CombineMatcherParams<T extends readonly MatcherPatternQuery[]> =
//   T extends readonly [infer First, ...infer Rest]
//     ? First extends MatcherPatternQuery
//       ? Rest extends readonly MatcherPatternQuery[]
//         ? ExtractMatcherQueryParams<First> & CombineMatcherParams<Rest>
//         : ExtractMatcherQueryParams<First>
//       : never
//     : {}

const PAGE_QUERY_PATTERN_MATCHER: MatcherPatternQuery<{ page: number }> = {
  match: query => {
    const page = Number(query.page)
    return {
      page: Number.isNaN(page) ? 1 : page,
    }
  },
  build: params => ({ page: String(params.page) }),
}

const QUERY_PATTERN_MATCHER: MatcherPatternQuery<{ q: string }> = {
  match: query => {
    return {
      q: typeof query.q === 'string' ? query.q : '',
    }
  },
  build: params => {
    return { q: params.q || '' }
  },
}

// function combineQueryMatchers<const T extends MatcherPatternQuery[]>(
//   ...matchers: T
// ): MatcherPatternQuery<CombineMatcherParams<T>> {
//   return {
//     match: (query: MatcherQueryParams): CombineMatcherParams<T> => {
//       return matchers.reduce((acc, matcher) => {
//         return { ...acc, ...matcher.match(query) }
//       }, {} as CombineMatcherParams<T>)
//     },
//     build: (
//       params: CombineMatcherParams<T>
//     ): Record<string, string | string[]> => {
//       return matchers.reduce(
//         (acc, matcher) => {
//           return { ...acc, ...matcher.build(params) }
//         },
//         {} as Record<string, string | string[]>
//       )
//     },
//   }
// }
//
// const a = combineQueryMatchers(
//   PAGE_QUERY_PATTERN_MATCHER,
//   QUERY_PATTERN_MATCHER
// )

const QUERY_MATCHER_COMBINED: MatcherPatternQuery<{
  page: number
  q: string
}> = {
  match: query => {
    return {
      ...PAGE_QUERY_PATTERN_MATCHER.match(query),
      ...QUERY_PATTERN_MATCHER.match(query),
    }
  },
  build: params => ({
    ...PAGE_QUERY_PATTERN_MATCHER.build(params),
    ...QUERY_PATTERN_MATCHER.build(params),
  }),
}

const ANY_HASH_PATTERN_MATCHER: MatcherPatternHash<// hash could be named anything, in this case it creates a param named hash
{ hash: string | null }> = {
  match: hash => ({ hash: hash ? hash.slice(1) : null }),
  build: ({ hash }) => (hash ? `#${hash}` : ''),
}

const r_group = normalizeRouteRecord({
  // cannot have a name because it's a group
  meta: {
    fromGroup: 'r_group',
  },
})

const r_home = normalizeRouteRecord({
  name: 'home',
  path: new MatcherPatternPathStatic('/'),
  query: QUERY_MATCHER_COMBINED,
  parent: r_group,
  components: { default: PageHome },
})

const r_about = normalizeRouteRecord({
  name: 'about',
  path: new MatcherPatternPathStatic('/about'),
  hash: ANY_HASH_PATTERN_MATCHER,
  components: { default: () => import('../pages/about.vue') },
})

const r_profiles_layout = normalizeRouteRecord({
  // cannot have a name because it's a layout and can't be matched (no path, query, or hash)
  // name: 'profile',
  // path: new MatcherPatternPathStatic('/profile'),
  components: { default: () => import('../pages/profiles/+layout.vue') },
  meta: {
    layout: 'profile',
  },
})

const r_profiles_list = normalizeRouteRecord({
  name: 'profiles-list',
  components: { default: () => import('../pages/profiles/(list).vue') },
  path: new MatcherPatternPathStatic('/profiles'),
  parent: r_profiles_layout,
})

const r_nested = normalizeRouteRecord({
  name: 'nested',
  components: { default: () => import('../pages/nested.vue') },
  path: new MatcherPatternPathStatic('/nested'),
})

const r_nested_a = normalizeRouteRecord({
  name: 'nested-a',
  components: { default: () => import('../pages/nested/a.vue') },
  parent: r_nested,
  path: new MatcherPatternPathStatic('/nested/a'),
})

export const router = experimental_createRouter({
  history: createWebHistory(),
  resolver: createStaticResolver<EXPERIMENTAL_RouteRecordNormalized_Matchable>([
    r_home,
    r_about,
    r_nested,
    r_nested_a,
    r_profiles_list,
  ]),
})
