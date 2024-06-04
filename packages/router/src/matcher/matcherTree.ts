import { RouteRecordMatcher } from './pathMatcher'
import { comparePathParserScore } from './pathParserRanker'

type MatcherTree = {
  add: (matcher: RouteRecordMatcher) => void
  remove: (matcher: RouteRecordMatcher) => void
  find: (path: string) => RouteRecordMatcher | undefined
  toArray: () => RouteRecordMatcher[]
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
  const root = createMatcherNode()
  const exactMatchers: Record<string, RouteRecordMatcher[]> =
    Object.create(null)

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

function createMatcherNode(depth = 1): MatcherTree {
  let segments: Record<string, MatcherTree> | null = null
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

function findInsertionIndex(
  matcher: RouteRecordMatcher,
  matchers: RouteRecordMatcher[]
) {
  let i = 0
  while (
    i < matchers.length &&
    comparePathParserScore(matcher, matchers[i]) >= 0 &&
    // Adding children with empty path should still appear before the parent
    // https://github.com/vuejs/router/issues/1124
    (matcher.record.path !== matchers[i].record.path ||
      !isRecordChildOf(matcher, matchers[i]))
  )
    i++

  return i
}

function isRecordChildOf(
  record: RouteRecordMatcher,
  parent: RouteRecordMatcher
): boolean {
  return parent.children.some(
    child => child === record || isRecordChildOf(record, child)
  )
}
