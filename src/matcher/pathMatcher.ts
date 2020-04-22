import { RouteRecord } from './types'
import {
  tokensToParser,
  PathParser,
  PathParserOptions,
} from './pathParserRanker'
import { tokenizePath } from './pathTokenizer'

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
  const matcher: RouteRecordMatcher = {
    ...parser,
    record,
    parent,
    // these needs to be populated by the parent
    children: [],
    alias: [],
  }

  if (parent) {
    // both are aliases or both are not aliases
    // we don't want to mix them because the order is used when
    // passing originalRecord in Matcher.addRoute
    if (!matcher.record.aliasOf === !parent.record.aliasOf)
      parent.children.push(matcher)
    // else TODO: save alias children to be able to remove them
  }

  return matcher
}
