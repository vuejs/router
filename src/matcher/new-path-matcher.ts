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
  // TODO: children so they can be removed
  // children: RouteRecordMatcher[]
}

export function createRouteRecordMatcher(
  record: Readonly<RouteRecordNormalized>,
  parent: RouteRecordMatcher | undefined,
  options?: PathParserOptions
): RouteRecordMatcher {
  const parser = tokensToParser(tokenizePath(record.path), options)

  return {
    ...parser,
    record,
    parent,
  }
}
