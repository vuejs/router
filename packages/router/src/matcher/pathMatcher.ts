import type { RouteRecord } from './types'
import type { PathParser, PathParserOptions } from './pathParserRanker'
import { tokensToParser } from './pathParserRanker'
import { tokenizePath } from './pathTokenizer'
import { diagnostics } from '../diagnostics'
import { assign } from '../utils'

export interface RouteRecordMatcher extends PathParser {
  record: RouteRecord
  parent: RouteRecordMatcher | undefined
  children: RouteRecordMatcher[]
  // aliases that must be removed when removing this record
  alias: RouteRecordMatcher[]
}

/**
 * Path parsers, by path and the options that shape them. A parser depends only on
 * those and is never mutated after it's created, so every router created from the
 * same routes (e.g. one per request during SSR) can reuse them instead of
 * tokenizing and compiling every path again.
 */
const pathParserCache = new Map<string, PathParser>()
/**
 * Bound for apps that keep adding routes with new paths. Far above any static
 * route table; the cache is cleared when it's reached.
 */
const PATH_PARSER_CACHE_MAX = 50_000

function getPathParser(path: string, options?: PathParserOptions): PathParser {
  const key =
    path +
    '\0' +
    (options?.sensitive ? 1 : 0) +
    (options?.strict ? 1 : 0) +
    (options?.end === false ? 0 : 1)
  let parser = pathParserCache.get(key)
  if (!parser) {
    if (pathParserCache.size >= PATH_PARSER_CACHE_MAX) pathParserCache.clear()
    parser = tokensToParser(tokenizePath(path), options)
    pathParserCache.set(key, parser)
  }
  return parser
}

export function createRouteRecordMatcher(
  record: Readonly<RouteRecord>,
  parent: RouteRecordMatcher | undefined,
  options?: PathParserOptions
): RouteRecordMatcher {
  const parser = getPathParser(record.path, options)

  // warn against params with the same name
  if (__DEV__) {
    const existingKeys = new Set<string>()
    for (const key of parser.keys) {
      if (existingKeys.has(key.name))
        diagnostics.VUE_ROUTER_R0090({ name: key.name, path: record.path })
      existingKeys.add(key.name)
    }
  }

  // a new object: the parser is shared, the record, parent, children and alias are not
  const matcher: RouteRecordMatcher = assign({}, parser, {
    record,
    parent,
    // these needs to be populated by the parent
    children: [],
    alias: [],
  })

  if (parent) {
    // both are aliases or both are not aliases
    // we don't want to mix them because the order is used when
    // passing originalRecord in Matcher.addRoute
    if (!matcher.record.aliasOf === !parent.record.aliasOf)
      parent.children.push(matcher)
  }

  return matcher
}
