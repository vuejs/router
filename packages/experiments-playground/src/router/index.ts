import { createWebHistory } from 'vue-router'
import {
  experimental_createRouter,
  createFixedResolver,
  MatcherPatternPathStatic,
  MatcherPatternPathCustomParams,
  normalizeRouteRecord,
  PARAM_PARSER_INT,
} from 'vue-router/experimental'
import type {
  EXPERIMENTAL_RouteRecordNormalized_Matchable,
  MatcherPatternHash,
  MatcherPatternQuery,
  EmptyParams,
} from 'vue-router/experimental'
import PageHome from '../pages/(home).vue'

const PAGE_QUERY_PATTERN_MATCHER: MatcherPatternQuery<{ page: number }> = {
  match: query => {
    const page = Number(query.page)
    return {
      page: Number.isNaN(page) ? 1 : page,
    }
  },
  build: params => ({ page: String(params.page) }),
}

const QUERY_PATTERN_MATCHER: MatcherPatternQuery<{ q?: string }> = {
  match: query => {
    return {
      q: typeof query.q === 'string' ? query.q : '',
    }
  },
  // NOTE: we need either to cast or to add an explicit return type annotation
  // because of the special meaning of {} in TypeScript.
  build: (params): { q?: string } => {
    return params.q ? { q: params.q } : ({} as EmptyParams)
  },
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
  query: [PAGE_QUERY_PATTERN_MATCHER, QUERY_PATTERN_MATCHER],
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
  query: [PAGE_QUERY_PATTERN_MATCHER],
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

const r_profiles_detail = normalizeRouteRecord({
  name: 'profiles-detail',
  components: { default: () => import('../pages/profiles/[userId].vue') },
  parent: r_profiles_layout,
  path: new MatcherPatternPathCustomParams(
    /^\/profiles\/([^/]+)$/i,
    {
      // this version handles all kind of params but in practice,
      // the generation should recognize this is a single required param
      // and therefore userId is of type number
      userId: PARAM_PARSER_INT,
    },
    ['profiles', 0]
  ),
})

export const router = experimental_createRouter({
  history: createWebHistory(),
  resolver: createFixedResolver<EXPERIMENTAL_RouteRecordNormalized_Matchable>([
    r_home,
    r_about,
    r_nested,
    r_nested_a,
    r_profiles_list,
    r_profiles_detail,
  ]),
})

router.beforeEach(to => {
  console.log(`➡️ ${to.fullPath}`)
})
router.afterEach((to, _from, failure) => {
  if (failure) {
    console.log('╳ ', failure)
  } else {
    console.log(`✔️ ${to.fullPath}`)
  }
})

router.onError(error => {
  console.error('❌', error)
})
