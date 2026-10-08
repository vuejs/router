import { tokenizePath, TokenType } from '../../../matcher/pathTokenizer'
import { diagnostics } from '../../../diagnostics'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
  type MatcherPatternPathDynamic_ParamOptions,
} from './matcher-pattern'

// default pattern for a param: non-greedy everything but /
const BASE_PARAM_PATTERN = '[^/]+?'

// Special Regex characters that must be escaped in static tokens
const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g

/**
 * Parses a path written with the classic route syntax (e.g. `/users/:id(\\d+)`,
 * `/:pathMatch(.*)*`) into a {@link MatcherPatternPathStatic} or a
 * {@link MatcherPatternPathDynamic}. The pattern is strict (a trailing slash
 * must match) and case insensitive. A param with a `(.*)` regexp is a splat:
 * its slashes are not encoded.
 *
 * @param path - absolute path with the classic syntax
 */
export function parseClassicPath(
  path: string
):
  | MatcherPatternPathStatic
  | MatcherPatternPathDynamic<
      Record<string, MatcherPatternPathDynamic_ParamOptions>
    > {
  // an empty root path is the same as `/`
  path ||= '/'
  const segments = tokenizePath(path)
  const params: Record<string, MatcherPatternPathDynamic_ParamOptions> = {}
  const pathParts: Array<string | number | Array<string | number>> = []
  let re = '^'
  let trailingSlash: boolean | null = false
  let hasParams = false

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const isLastSegment = i === segments.length - 1
    // a trailing slash creates an empty segment
    if (!segment.length) {
      if (isLastSegment && i) {
        re += '/'
        trailingSlash = true
      }
      continue
    }

    const parts: Array<string | number> = []
    for (let j = 0; j < segment.length; j++) {
      const token = segment[j]
      if (token.type === TokenType.Static) {
        if (!j) re += '/'
        re += token.value.replace(REGEX_CHARS_RE, '\\$&')
        parts.push(token.value)
      } else if (token.type === TokenType.Param) {
        hasParams = true
        const { value, repeatable, optional } = token
        // the tokenizer gives an empty string without a custom regexp
        const regexp = token.regexp || BASE_PARAM_PATTERN
        const isSplat = regexp === '.*'

        if (__DEV__ && value in params) {
          diagnostics.VUE_ROUTER_R0090({ name: value, path })
        }

        let subPattern = repeatable
          ? // a repeatable splat must not match an empty value
            isSplat
            ? '(.+)'
            : `((?:${regexp})(?:/(?:${regexp}))*)`
          : `(${regexp})`
        // prepend the slash if we are starting a new segment
        if (!j) {
          // avoid an optional / if there are more tokens e.g. /:p?-static
          subPattern =
            optional && segment.length < 2
              ? // `/:p?` must still match `/`
                segments.length === 1
                ? `/(?:${subPattern})`
                : `(?:/${subPattern})`
              : '/' + subPattern
        }
        if (optional) subPattern += '?'
        re += subPattern

        params[value] = [undefined, repeatable, optional]
        parts.push(isSplat ? 0 : 1)
        // a trailing splat can match a trailing slash and `/:p?` matches `/`
        if (
          (isSplat && isLastSegment && j === segment.length - 1) ||
          (optional && segments.length === 1 && segment.length === 1)
        ) {
          trailingSlash = null
        }
      }
    }
    pathParts.push(parts.length === 1 ? parts[0] : parts)
  }

  // when all the params are optional, the path can be empty but must match `/`
  if (new RegExp(re + '$').test('')) {
    re = '^(?:' + re.slice(1) + '|/)'
  }

  return hasParams
    ? new MatcherPatternPathDynamic(
        new RegExp(re + '$', 'i'),
        params,
        pathParts,
        trailingSlash
      )
    : new MatcherPatternPathStatic(
        '/' + pathParts.join('/') + (trailingSlash ? '/' : '')
      )
}
