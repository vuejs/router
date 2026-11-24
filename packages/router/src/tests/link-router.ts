import type { Component } from 'vue'
import {
  experimental_createRouter,
  normalizeRouteRecord,
} from '../experimental/router'
import { createFixedResolver } from '../experimental/route-resolver/resolver-fixed'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from '../experimental/route-resolver/matchers/matcher-pattern'
import { MatcherPatternQueryParam } from '../experimental/route-resolver/matchers/matcher-pattern-query'
import { PARAM_PARSER_INT } from '../experimental/route-resolver/matchers/param-parsers'
import { createMemoryHistory } from '../history/memory'

/**
 * Creates the experimental router used by the RouterLink specs. `Layout` must
 * render a `RouterView`.
 */
export function createLinkTestRouter(
  { Page, Layout }: { Page: Component; Layout: Component },
  options: { linkActiveClass?: string } = {}
) {
  const home = normalizeRouteRecord({
    name: 'home',
    path: new MatcherPatternPathStatic('/'),
    components: { default: Page },
  })
  const users = normalizeRouteRecord({
    name: 'users',
    path: new MatcherPatternPathStatic('/users'),
    components: { default: Layout },
  })
  // index child: shares the path matcher of its parent
  const usersIndex = normalizeRouteRecord({
    name: 'users-index',
    path: users.path,
    components: { default: Page },
    parent: users,
  })
  const user = normalizeRouteRecord({
    name: 'user',
    path: new MatcherPatternPathDynamic(
      /^\/users\/([^/]+?)$/i,
      { id: [PARAM_PARSER_INT] },
      ['users', 1]
    ),
    components: { default: Page },
    parent: users,
  })
  const about = normalizeRouteRecord({
    name: 'about',
    path: new MatcherPatternPathStatic('/about'),
    components: { default: Page },
  })
  const aboutAlias = normalizeRouteRecord({
    ...about,
    path: new MatcherPatternPathStatic('/about-alias'),
    aliasOf: about,
  })
  const search = normalizeRouteRecord({
    name: 'search',
    path: new MatcherPatternPathStatic('/search'),
    query: [
      new MatcherPatternQueryParam(
        'page',
        'page',
        'value',
        PARAM_PARSER_INT,
        1
      ),
    ],
    components: { default: Page },
  })

  return experimental_createRouter({
    history: createMemoryHistory(),
    resolver: createFixedResolver([
      home,
      usersIndex,
      users,
      user,
      about,
      aboutAlias,
      search,
    ]),
    ...options,
  })
}
