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

export function createRouteRecordMatcher(
  record: Readonly<RouteRecord>,
  parent: RouteRecordMatcher | undefined,
  options?: PathParserOptions
): RouteRecordMatcher {
  const parser = tokensToParser(tokenizePath(record.path), options)

  // warn against params with the same name
  if (__DEV__) {
    const existingKeys = new Set<string>()
    for (const key of parser.keys) {
      if (existingKeys.has(key.name))
        diagnostics.VR_R0090({ name: key.name, path: record.path })
      existingKeys.add(key.name)
    }
  }

  const matcher: RouteRecordMatcher = assign(parser, {
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
