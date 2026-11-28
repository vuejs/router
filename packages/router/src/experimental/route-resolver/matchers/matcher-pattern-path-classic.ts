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
const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\|]/g

/**
 * Options of {@link parseClassicPath}. They mirror the options of the Vue
 * Router plugin, so runtime paths behave like the generated ones.
 */
export interface ClassicPathOptions {
  /**
   * Match paths case sensitively.
   *
   * @default `false`
   */
  caseSensitive?: boolean

  /**
   * How to handle trailing slashes. `'always'` only matches paths with a
   * trailing slash, `'never'` only matches paths without one, and `'ignore'`
   * matches both. Built paths have a trailing slash only with `'always'`. A
   * trailing slash in the parsed path is ignored. Paths ending with a splat
   * param ignore this option.
   *
   * @default `'never'`
   */
  trailingSlash?: 'always' | 'never' | 'ignore'
}

/**
 * Parses a path written with the classic route syntax (e.g. `/users/:id(\\d+)`,
 * `/:pathMatch(.*)*`) into a {@link MatcherPatternPathStatic} or a
 * {@link MatcherPatternPathDynamic}. A param with a `(.*)` regexp is a splat:
 * its slashes are not encoded.
 *
 * @param path - absolute path with the classic syntax
 * @param options - case sensitivity and trailing slash handling
 */
export function parseClassicPath(
  path: string,
  { caseSensitive, trailingSlash = 'never' }: ClassicPathOptions = {}
):
  | MatcherPatternPathStatic
  | MatcherPatternPathDynamic<
      Record<string, MatcherPatternPathDynamic_ParamOptions>
    > {
  const segments = tokenizePath(path)
  const params: Record<string, MatcherPatternPathDynamic_ParamOptions> = {}
  const pathParts: Array<string | number | Array<string | number>> = []
  let re = '^'
  let hasParams = false
  let endsWithSplat = false
  // `/:a?/:b*` must still match `/`
  let allOptional = true

  for (const segment of segments) {
    // a trailing slash creates an empty segment
    if (!segment.length) continue

    const parts: Array<string | number> = []
    for (let j = 0; j < segment.length; j++) {
      const token = segment[j]
      endsWithSplat = false
      if (token.type === TokenType.Static) {
        if (!j) re += '/'
        re += token.value.replace(REGEX_CHARS_RE, '\\$&')
        parts.push(token.value)
        allOptional = false
      } else if (token.type === TokenType.Param) {
        hasParams = true
        const { value, repeatable, optional } = token
        // the tokenizer gives an empty string without a custom regexp
        const regexp = token.regexp || BASE_PARAM_PATTERN
        const isSplat = regexp === '.*'
        allOptional &&= optional

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
          // the slash of a lone optional param is optional too: `/:p?` matches `/`
          subPattern =
            optional && segment.length < 2
              ? `(?:/${subPattern})`
              : '/' + subPattern
        }
        if (optional) subPattern += '?'
        re += subPattern

        params[value] = [undefined, repeatable, optional]
        parts.push(isSplat ? 0 : 1)
        endsWithSplat = isSplat
      }
    }
    pathParts.push(parts.length === 1 ? parts[0] : parts)
  }

  const ignore = trailingSlash === 'ignore'
  const always = trailingSlash === 'always'

  if (!hasParams) {
    const staticPath = '/' + pathParts.join('/')
    const isRoot = staticPath === '/'
    // the static matcher is strict, it cannot ignore the trailing slash
    if (isRoot || !ignore) {
      return new MatcherPatternPathStatic(
        staticPath + (always && !isRoot ? '/' : ''),
        !caseSensitive
      )
    }
  }

  // a trailing splat already matches any trailing slash
  if (always && !endsWithSplat) {
    // when all the params are optional, `/` must still match
    re = allOptional ? `^(?:${re.slice(1)})?/` : re + '/'
  } else if (allOptional || (ignore && !endsWithSplat)) {
    // with only optional params, the matcher rejects other trailing slashes
    re += '/?'
  }

  return new MatcherPatternPathDynamic(
    new RegExp(re + '$', caseSensitive ? '' : 'i'),
    params,
    pathParts,
    endsWithSplat || ignore ? null : always
  )
}
