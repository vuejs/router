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

const PAGE_QUERY_PATTERN_MATCHER: MatcherPatternQuery<{ page: number }> = {
  match: query => {
    const page = Number(query.page)
    return {
      page: Number.isNaN(page) ? 1 : page,
    }
  },
  build: params => ({ page: String(params.page) }),
}

const ANY_HASH_PATTERN_MATCHER: MatcherPatternHash<// hash could be named anything, in this case it creates a param named hash
{ hash: string | null }> = {
  match: hash => ({ hash: hash ? hash.slice(1) : null }),
  build: ({ hash }) => (hash ? `#${hash}` : ''),
}

const r_home = normalizeRouteRecord({
  name: 'home',
  path: new MatcherPatternPathStatic('/'),
  query: PAGE_QUERY_PATTERN_MATCHER,
  components: { default: PageHome },
})

const r_about = normalizeRouteRecord({
  name: 'about',
  path: new MatcherPatternPathStatic('/about'),
  hash: ANY_HASH_PATTERN_MATCHER,
  components: { default: () => import('../pages/about.vue') },
})

export const router = experimental_createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  resolver: createStaticResolver<EXPERIMENTAL_RouteRecordNormalized_Matchable>([
    r_home,
    r_about,
  ]),
})
