import { EmptyParams } from '../matcher-location'
import {
  MatcherPatternPath,
  MatcherPatternQuery,
  MatcherPatternParams_Base,
  MatcherPattern,
} from '../matcher-pattern'
import { miss } from './errors'

export const ANY_PATH_PATTERN_MATCHER: MatcherPatternPath<{
  pathMatch: string
}> = {
  match(path) {
    return { pathMatch: path }
  },
  build({ pathMatch }) {
    return pathMatch
  },
}

export const EMPTY_PATH_PATTERN_MATCHER: MatcherPatternPath<EmptyParams> = {
  match: path => {
    if (path !== '/') {
      throw miss()
    }
    return {}
  },
  build: () => '/',
}

export const USER_ID_PATH_PATTERN_MATCHER: MatcherPatternPath<{ id: number }> =
  {
    match(value) {
      const match = value.match(/^\/users\/(\d+)$/)
      if (!match?.[1]) {
        throw miss()
      }
      const id = Number(match[1])
      if (Number.isNaN(id)) {
        throw miss()
      }
      return { id }
    },
    build({ id }) {
      return `/users/${id}`
    },
  }

export const PAGE_QUERY_PATTERN_MATCHER: MatcherPatternQuery<{ page: number }> =
  {
    match: query => {
      const page = Number(query.page)
      return {
        page: Number.isNaN(page) ? 1 : page,
      }
    },
    build: params => ({ page: String(params.page) }),
  } satisfies MatcherPatternQuery<{ page: number }>

export const ANY_HASH_PATTERN_MATCHER: MatcherPatternParams_Base<
  string,
  { hash: string | null }
> = {
  match: hash => ({ hash: hash ? hash.slice(1) : null }),
  build: ({ hash }) => (hash ? `#${hash}` : ''),
}

export const EMPTY_PATH_ROUTE = {
  name: 'no params',
  path: EMPTY_PATH_PATTERN_MATCHER,
} satisfies MatcherPattern

export const USER_ID_ROUTE = {
  name: 'user-id',
  path: USER_ID_PATH_PATTERN_MATCHER,
} satisfies MatcherPattern
