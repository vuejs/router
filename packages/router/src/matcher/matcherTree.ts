import { RouteRecordMatcher } from './pathMatcher'
import { comparePathParserScore } from './pathParserRanker'
import { warn } from '../warning'

type MatcherNode = {
  add: (matcher: RouteRecordMatcher) => void
  remove: (matcher: RouteRecordMatcher) => void
  find: (path: string) => RouteRecordMatcher | undefined
  toArray: () => RouteRecordMatcher[]
}

type MatcherTree = MatcherNode & {
  clear: () => void
}

function normalizePath(path: string) {
  // We match case-insensitively initially, then let the matcher check more rigorously
  path = path.toUpperCase()

  // TODO: Check more thoroughly whether this is really necessary
  while (path.endsWith('/')) {
    path = path.slice(0, -1)
  }

  return path
}

function chooseBestMatcher(
  firstMatcher: RouteRecordMatcher | undefined,
  secondMatcher: RouteRecordMatcher | undefined
) {
  if (secondMatcher) {
    if (
      !firstMatcher ||
      comparePathParserScore(firstMatcher, secondMatcher) > 0
    ) {
      firstMatcher = secondMatcher
    }
  }

  return firstMatcher
}

export function createMatcherTree(): MatcherTree {
  let root = createMatcherNode()
  let exactMatchers: Record<string, RouteRecordMatcher[]> = Object.create(null)

  return {
    add(matcher) {
      if (matcher.staticPath) {
        const path = normalizePath(matcher.record.path)

        exactMatchers[path] = exactMatchers[path] || []
        insertMatcher(matcher, exactMatchers[path])
      } else {
        root.add(matcher)
      }
    },

    remove(matcher) {
      if (matcher.staticPath) {
        const path = normalizePath(matcher.record.path)

        if (exactMatchers[path]) {
          // TODO: Remove array if length is zero
          remove(matcher, exactMatchers[path])
        }
      } else {
        root.remove(matcher)
      }
    },

    clear() {
      root = createMatcherNode()
      exactMatchers = Object.create(null)
    },

    find(path) {
      const matchers = exactMatchers[normalizePath(path)]

      return chooseBestMatcher(
        matchers && matchers.find(matcher => matcher.re.test(path)),
        root.find(path)
      )
    },

    toArray() {
      const arr = root.toArray()

      for (const key in exactMatchers) {
        arr.unshift(...exactMatchers[key])
      }

      return arr
    },
  }
}

function createMatcherNode(depth = 1): MatcherNode {
  let segments: Record<string, MatcherNode> | null = null
  let wildcards: RouteRecordMatcher[] | null = null

  return {
    add(matcher) {
      const { staticTokens } = matcher
      const myToken = staticTokens[depth - 1]?.toUpperCase()

      if (myToken != null) {
        if (!segments) {
          segments = Object.create(null)
        }

        if (!segments![myToken]) {
          segments![myToken] = createMatcherNode(depth + 1)
        }

        segments![myToken].add(matcher)

        return
      }

      if (!wildcards) {
        wildcards = []
      }

      insertMatcher(matcher, wildcards)
    },

    remove(matcher) {
      // TODO: Remove any empty data structures
      if (segments) {
        const myToken = matcher.staticTokens[depth - 1]?.toUpperCase()

        if (myToken != null) {
          if (segments[myToken]) {
            segments[myToken].remove(matcher)
            return
          }
        }
      }

      if (wildcards) {
        remove(matcher, wildcards)
      }
    },

    find(path) {
      const tokens = path.split('/')
      const myToken = tokens[depth]
      let matcher: RouteRecordMatcher | undefined

      if (segments && myToken != null) {
        const segmentMatcher = segments[myToken.toUpperCase()]

        if (segmentMatcher) {
          matcher = segmentMatcher.find(path)
        }
      }

      if (wildcards) {
        matcher = chooseBestMatcher(
          matcher,
          wildcards.find(matcher => matcher.re.test(path))
        )
      }

      return matcher
    },

    toArray() {
      const matchers: RouteRecordMatcher[] = []

      for (const key in segments) {
        // TODO: push may not scale well enough
        matchers.push(...segments[key].toArray())
      }

      if (wildcards) {
        matchers.push(...wildcards)
      }

      return matchers
    },
  }
}

function remove<T>(item: T, items: T[]) {
  const index = items.indexOf(item)

  if (index > -1) {
    items.splice(index, 1)
  }
}

function insertMatcher(
  matcher: RouteRecordMatcher,
  matchers: RouteRecordMatcher[]
) {
  const index = findInsertionIndex(matcher, matchers)
  matchers.splice(index, 0, matcher)
}

/**
 * Performs a binary search to find the correct insertion index for a new matcher.
 *
 * Matchers are primarily sorted by their score. If scores are tied then we also consider parent/child relationships,
 * with descendants coming before ancestors. If there's still a tie, new routes are inserted after existing routes.
 *
 * @param matcher - new matcher to be inserted
 * @param matchers - existing matchers
 */
function findInsertionIndex(
  matcher: RouteRecordMatcher,
  matchers: RouteRecordMatcher[]
) {
  // First phase: binary search based on score
  let lower = 0
  let upper = matchers.length

  while (lower !== upper) {
    const mid = (lower + upper) >> 1
    const sortOrder = comparePathParserScore(matcher, matchers[mid])

    if (sortOrder < 0) {
      upper = mid
    } else {
      lower = mid + 1
    }
  }

  // Second phase: check for an ancestor with the same score
  const insertionAncestor = getInsertionAncestor(matcher)

  if (insertionAncestor) {
    upper = matchers.lastIndexOf(insertionAncestor, upper - 1)

    if (__DEV__ && upper < 0) {
      // This should never happen
      warn(
        `Finding ancestor route "${insertionAncestor.record.path}" failed for "${matcher.record.path}"`
      )
    }
  }

  return upper
}

function getInsertionAncestor(matcher: RouteRecordMatcher) {
  let ancestor: RouteRecordMatcher | undefined = matcher

  while ((ancestor = ancestor.parent)) {
    if (
      isMatchable(ancestor) &&
      matcher.staticTokens.length === ancestor.staticTokens.length &&
      comparePathParserScore(matcher, ancestor) === 0 &&
      ancestor.staticTokens.every(
        (token, index) =>
          matcher.staticTokens[index].toUpperCase() === token.toUpperCase()
      )
    ) {
      return ancestor
    }
  }

  return
}

/**
 * Checks if a matcher can be reachable. This means if it's possible to reach it as a route. For example, routes without
 * a component, or name, or redirect, are just used to group other routes.
 * @param matcher
 * @param matcher.record record of the matcher
 * @returns
 */
// TODO: This should probably live elsewhere
export function isMatchable({ record }: RouteRecordMatcher): boolean {
  return !!(
    record.name ||
    (record.components && Object.keys(record.components).length) ||
    record.redirect
  )
}
