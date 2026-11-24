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
import type { EXPERIMENTAL_RouterOptions_Base } from '../experimental/router'

export type LinkTestRouterOptions = Pick<
  EXPERIMENTAL_RouterOptions_Base,
  'linkActiveClass' | 'linkExactActiveClass'
>

/**
 * Creates the experimental router used by the RouterLink specs. `Layout` must
 * render a `RouterView`.
 */
export function createLinkTestRouter(
  { Page, Layout }: { Page: Component; Layout: Component },
  options: LinkTestRouterOptions = {}
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
  const userPosts = normalizeRouteRecord({
    name: 'user-posts',
    path: new MatcherPatternPathDynamic(
      /^\/users\/([^/]+?)\/posts$/i,
      { id: [PARAM_PARSER_INT] },
      ['users', 1, 'posts']
    ),
    components: { default: Page },
    parent: user,
  })
  // aliases: /users/list (index child), /users/id/:id (child), /u (parent),
  // /u/:id and /u/id/:id (child under the parent alias)
  const usersIndexAlias = normalizeRouteRecord({
    ...usersIndex,
    path: new MatcherPatternPathStatic('/users/list'),
    aliasOf: usersIndex,
  })
  const userAlias = normalizeRouteRecord({
    ...user,
    path: new MatcherPatternPathDynamic(
      /^\/users\/id\/([^/]+?)$/i,
      { id: [PARAM_PARSER_INT] },
      ['users', 'id', 1]
    ),
    aliasOf: user,
  })
  const usersAlias = normalizeRouteRecord({
    ...users,
    path: new MatcherPatternPathStatic('/u'),
    aliasOf: users,
  })
  const userUnderUsersAlias = normalizeRouteRecord({
    ...user,
    path: new MatcherPatternPathDynamic(
      /^\/u\/([^/]+?)$/i,
      { id: [PARAM_PARSER_INT] },
      ['u', 1]
    ),
    parent: usersAlias,
    aliasOf: user,
  })
  const userAliasUnderUsersAlias = normalizeRouteRecord({
    ...user,
    path: new MatcherPatternPathDynamic(
      /^\/u\/id\/([^/]+?)$/i,
      { id: [PARAM_PARSER_INT] },
      ['u', 'id', 1]
    ),
    parent: usersAlias,
    aliasOf: user,
  })
  // repeatable param, a single item becomes a string
  const files = normalizeRouteRecord({
    name: 'files',
    path: new MatcherPatternPathDynamic(
      /^\/files\/(.+?)$/i,
      {
        p: [
          {
            get: (v: string[]) => (v.length > 1 ? v : v[0]!),
            set: (v: string | string[]) => v,
          },
          true,
        ],
      },
      ['files', 1]
    ),
    components: { default: Page },
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
      usersIndexAlias,
      users,
      user,
      userPosts,
      userAlias,
      usersAlias,
      userUnderUsersAlias,
      userAliasUnderUsersAlias,
      about,
      aboutAlias,
      search,
      files,
    ]),
    ...options,
  })
}
