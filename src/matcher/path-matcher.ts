import { RouteRecordNormalized } from './types'
import {
  tokensToParser,
  PathParser,
  PathParserOptions,
} from './path-parser-ranker'
import { tokenizePath } from './path-tokenizer'
import { RouteRecordRedirect } from '../types'

export interface RouteRecordMatcher extends PathParser {
  record: RouteRecordNormalized
  parent: RouteRecordMatcher | undefined
  // TODO: children so they can be removed
  // children: RouteRecordMatcher[]
}

export function createRouteRecordMatcher(
  record: Readonly<RouteRecordNormalized | RouteRecordRedirect>,
  parent: RouteRecordMatcher | undefined,
  options?: PathParserOptions
): RouteRecordMatcher {
  const parser = tokensToParser(tokenizePath(record.path), options)

  return {
    ...parser,
    // @ts-ignore: TODO: adapt tokenstoparser
    record,
    parent,
  }
}
