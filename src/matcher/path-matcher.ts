import { RouteRecordNormalized } from './types'
import {
  tokensToParser,
  PathParser,
  PathParserOptions,
} from './path-parser-ranker'
import { tokenizePath } from './path-tokenizer'

export interface RouteRecordMatcher extends PathParser {
  record: RouteRecordNormalized
  parent: RouteRecordMatcher | undefined
  children: RouteRecordMatcher[]
}

export function createRouteRecordMatcher(
  record: Readonly<RouteRecordNormalized>,
  parent: RouteRecordMatcher | undefined,
  options?: PathParserOptions
): RouteRecordMatcher {
  const parser = tokensToParser(tokenizePath(record.path), options)

  const matcher: RouteRecordMatcher = {
    ...parser,
    record,
    parent,
    children: [],
  }

  if (parent) parent.children.push(matcher)
  return matcher
}
