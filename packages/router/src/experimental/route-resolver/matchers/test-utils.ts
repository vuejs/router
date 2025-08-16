import { EmptyParams } from './matcher-pattern'
import {
  MatcherPatternPath,
  MatcherPatternQuery,
  MatcherPatternHash,
} from './matcher-pattern'
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
        throw miss(`Invalid number: ${String(match[1])}`)
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
  }

export const ANY_HASH_PATTERN_MATCHER: MatcherPatternHash<// hash could be named anything, in this case it creates a param named hash
{ hash: string | null }> = {
  match: hash => ({ hash: hash ? hash.slice(1) : null }),
  build: ({ hash }) => (hash ? `#${hash}` : ''),
}
