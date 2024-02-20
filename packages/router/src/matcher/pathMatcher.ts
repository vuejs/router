import { RouteRecord } from './types'
import {
  tokensToParser,
  PathParser,
  PathParserOptions,
} from './pathParserRanker'
import { staticPathToParser } from './staticPathParser'
import { tokenizePath } from './pathTokenizer'
import { warn } from '../warning'
import { assign } from '../utils'

export interface RouteRecordMatcher extends PathParser {
  staticPath: boolean
  staticTokens: string[]
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
  const tokens = tokenizePath(record.path)

  // TODO: Merge options properly
  const staticPath =
    options?.end !== false &&
    tokens.every(
      segment =>
        segment.length === 0 || (segment.length === 1 && segment[0].type === 0)
    )

  const staticTokens: string[] = []

  for (const token of tokens) {
    if (token.length === 1 && token[0].type === 0) {
      staticTokens.push(token[0].value)
    } else {
      break
    }
  }

  const parser = staticPath
    ? staticPathToParser(record.path, tokens, options)
    : tokensToParser(tokens, options)

  // warn against params with the same name
  if (__DEV__) {
    const existingKeys = new Set<string>()
    for (const key of parser.keys) {
      if (existingKeys.has(key.name))
        warn(
          `Found duplicated params with name "${key.name}" for path "${record.path}". Only the last one will be available on "$route.params".`
        )
      existingKeys.add(key.name)
    }
  }

  const matcher: RouteRecordMatcher = assign(parser, {
    staticPath,
    staticTokens,
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
