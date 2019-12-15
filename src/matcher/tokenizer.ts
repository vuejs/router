export const enum TokenType {
  Static,
  Param,
}

const enum TokenizerState {
  Static,
  Param,
  ParamRegExp, // custom re for a param
  ParamRegExpEnd, // check if there is any ? + *
  EscapeNext,
}

interface TokenStatic {
  type: TokenType.Static
  value: string
}

interface TokenParam {
  type: TokenType.Param
  regexp?: string
  value: string
  optional: boolean
  repeatable: boolean
}

type Token = TokenStatic | TokenParam

// const ROOT_TOKEN: Token = {
//   type: TokenType.Static,
//   value: '/',
// }

const VALID_PARAM_RE = /[a-zA-Z0-9_]/

export function tokenizePath(path: string): Array<Token[]> {
  if (!path) return [[]]
  if (path === '/') return [[{ type: TokenType.Static, value: '' }]]
  // remove the leading slash
  if (path[0] !== '/') throw new Error('A non-empty path must start with "/"')

  function crash(message: string) {
    throw new Error(`ERR (${state})/"${buffer}": ${message}`)
  }

  let state: TokenizerState = TokenizerState.Static
  let previousState: TokenizerState = state
  const tokens: Array<Token[]> = []
  // the segment will always be valid because we get into the initial state
  // with the leading /
  let segment!: Token[]

  function finalizeSegment() {
    if (segment) tokens.push(segment)
    segment = []
  }

  // index on the path
  let i = 0
  // char at index
  let char: string
  // buffer of the value read
  let buffer: string = ''
  // custom regexp for a param
  let customRe: string = ''

  function consumeBuffer() {
    if (!buffer) return

    if (state === TokenizerState.Static) {
      segment.push({
        type: TokenType.Static,
        value: buffer,
      })
    } else if (
      state === TokenizerState.Param ||
      state === TokenizerState.ParamRegExp ||
      state === TokenizerState.ParamRegExpEnd
    ) {
      if (segment.length > 1 && (char === '*' || char === '+'))
        crash(
          `A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`
        )
      segment.push({
        type: TokenType.Param,
        value: buffer,
        regexp: customRe,
        repeatable: char === '*' || char === '+',
        optional: char === '*' || char === '?',
      })
    } else {
      crash('Invalid state to consume buffer')
    }
    buffer = ''
  }

  function addCharToBuffer() {
    buffer += char
  }

  while (i < path.length) {
    char = path[i++]

    if (char === '\\' && state !== TokenizerState.ParamRegExp) {
      previousState = state
      state = TokenizerState.EscapeNext
      continue
    }

    switch (state) {
      case TokenizerState.Static:
        if (char === '/') {
          if (buffer) {
            consumeBuffer()
          }
          finalizeSegment()
        } else if (char === ':') {
          consumeBuffer()
          state = TokenizerState.Param
        } else if (char === '{') {
          // TODO: handle group
        } else {
          addCharToBuffer()
        }
        break

      case TokenizerState.EscapeNext:
        addCharToBuffer()
        state = previousState
        break

      case TokenizerState.Param:
        if (char === '(') {
          state = TokenizerState.ParamRegExp
          customRe = ''
        } else if (VALID_PARAM_RE.test(char)) {
          addCharToBuffer()
        } else {
          consumeBuffer()
          state = TokenizerState.Static
          // go back one character if we were not modifying
          if (char !== '*' && char !== '?' && char !== '+') i--
        }
        break

      case TokenizerState.ParamRegExp:
        if (char === ')') {
          // handle the escaped )
          if (customRe[customRe.length - 1] == '\\')
            customRe = customRe.slice(0, -1) + char
          else state = TokenizerState.ParamRegExpEnd
        } else {
          customRe += char
        }
        break

      case TokenizerState.ParamRegExpEnd:
        // same as finalizing a param
        consumeBuffer()
        state = TokenizerState.Static
        // go back one character if we were not modifying
        if (char !== '*' && char !== '?' && char !== '+') i--
        break

      default:
        crash('Unkwnonw state')
        break
    }
  }

  if (state === TokenizerState.ParamRegExp)
    crash(`Unfinished custom RegExp for param "${buffer}"`)

  consumeBuffer()
  finalizeSegment()

  return tokens
}

type Params = Record<string, string | string[]>

interface ParamKey {
  name: string
  repeatable: boolean
  optional: boolean
}

export interface PathParser {
  re: RegExp
  score: number[]
  keys: ParamKey[]
  parse(path: string): Params | null
  stringify(params: Params): string
}

interface PathParserOptions {
  /**
   * Makes the RegExp case sensitive. Defaults to false
   */
  sensitive?: boolean
  /**
   * Should we allow a trailing slash. Defaults to true
   */
  strict?: boolean
  /**
   * Should the RegExp match from the beginning by prepending a ^. Defaults to true
   */
  start?: boolean
  /**
   * Should the RegExp match until the end by appending a $. Defaults to true
   */
  end?: boolean
  /**
   * Encodes a static value. This is used to encode params for them to be valid on the URL
   */
  encode?: (value: string) => string
  /**
   * Decodes a static value. This allows to produce decoded params when parsing an URL
   */
  decode?: (value: string) => string
}

const BASE_PARAM_PATTERN = '[^/]+?'

const BASE_PATH_PARSER_OPTIONS: Required<PathParserOptions> = {
  sensitive: false,
  strict: false,
  start: true,
  end: true,
  // TODO: implement real ones
  encode: v => v,
  decode: v => v,
}

// const enum PathScore {
//   _multiplier = 10,
//   Segment = 4 * _multiplier, // /a-segment
//   SubSegment = 2 * _multiplier, // /multiple-:things-in-one-:segment
//   Static = 3 * _multiplier, // /static
//   Dynamic = 2 * _multiplier, // /:someId
//   DynamicCustomRegexp = 2.5 * _multiplier, // /:someId(\\d+)
//   Wildcard = -1 * _multiplier, // /:namedWildcard(.*)
//   SubWildcard = 1 * _multiplier, // Wildcard as a subsegment
//   Repeatable = -0.5 * _multiplier, // /:w+ or /:w*
//   // these two have to be under 0.1 so a strict /:page is still lower than /:a-:b
//   Strict = 0.07 * _multiplier, // when options strict: true is passed, as the regex omits \/?
//   CaseSensitive = 0.025 * _multiplier, // when options strict: true is passed, as the regex omits \/?
//   Optional = -4 * _multiplier, // /:w? or /:w*
//   SubOptional = -0.1 * _multiplier, // optional inside a subsegment /a-:w? or /a-:w*
//   Root = 1 * _multiplier, // just /
// }

const enum PathScore {
  _multiplier = 10,
  Root = 8 * _multiplier, // just /
  Segment = 4 * _multiplier, // /a-segment
  SubSegment = 2 * _multiplier, // /multiple-:things-in-one-:segment
  Static = 3 * _multiplier, // /static
  Dynamic = 2 * _multiplier, // /:someId
  BonusCustomRegExp = 1 * _multiplier, // /:someId(\\d+)
  BonusWildcard = -4 * _multiplier - BonusCustomRegExp, // /:namedWildcard(.*) we remove the bonus added by the custom regexp
  BonusRepeatable = -2 * _multiplier, // /:w+ or /:w*
  BonusOptional = -1 * _multiplier, // /:w? or /:w*
  // these two have to be under 0.1 so a strict /:page is still lower than /:a-:b
  BonusStrict = 0.07 * _multiplier, // when options strict: true is passed, as the regex omits \/?
  BonusCaseSensitive = 0.025 * _multiplier, // when options strict: true is passed, as the regex omits \/?
}

/**
 * Creates a path parser from an array of Segments (a segment is an array of Tokens)
 *
 * @param segments array of segments returned by tokenizePath
 * @param extraOptions optional options for the regexp
 */
export function tokensToParser(
  segments: Array<Token[]>,
  extraOptions?: PathParserOptions
): PathParser {
  const options = {
    ...BASE_PATH_PARSER_OPTIONS,
    ...extraOptions,
  }

  // the amount of scores is the same as the length of segments
  let score: number[] = []
  let pattern = options.start ? '^' : ''
  const keys: ParamKey[] = []

  for (const segment of segments) {
    // allow an empty path to be different from slash
    // if (!segment.length) pattern += '/'

    // TODO: add strict and sensitive
    let segmentScore = segment.length
      ? segment.length > 1
        ? PathScore.SubSegment
        : PathScore.Segment
      : PathScore.Root

    for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
      const token = segment[tokenIndex]
      if (token.type === TokenType.Static) {
        // prepend the slash if we are starting a new segment
        if (!tokenIndex) pattern += '/'
        pattern += token.value

        segmentScore += PathScore.Static
      } else if (token.type === TokenType.Param) {
        keys.push({
          name: token.value,
          repeatable: token.repeatable,
          optional: token.optional,
        })
        const re = token.regexp ? token.regexp : BASE_PARAM_PATTERN
        if (re !== BASE_PARAM_PATTERN) {
          segmentScore += PathScore.BonusCustomRegExp
          try {
            new RegExp(`(${re})`)
          } catch (err) {
            throw new Error(
              `Invalid custom RegExp for param "${token.value}": ` + err.message
            )
          }
        }
        // (?:\/((?:${re})(?:\/(?:${re}))*))
        let subPattern = token.repeatable
          ? `((?:${re})(?:/(?:${re}))*)`
          : `(${re})`

        if (!tokenIndex)
          subPattern = token.optional ? `(?:/${subPattern})?` : '/' + subPattern
        else subPattern += token.optional ? '?' : ''

        pattern += subPattern

        segmentScore += PathScore.Dynamic
        if (token.optional) segmentScore += PathScore.BonusOptional
        if (token.repeatable) segmentScore += PathScore.BonusRepeatable
        if (re === '.*') segmentScore += PathScore.BonusWildcard
      }
    }

    score.push(segmentScore)
  }

  // TODO: warn double trailing slash
  if (!options.strict) pattern += '/?'

  if (options.end) pattern += '$'

  const re = new RegExp(pattern, options.sensitive ? '' : 'i')

  function parse(path: string): Params | null {
    const match = path.match(re)
    const params: Params = {}

    if (!match) return null

    for (let i = 1; i < match.length; i++) {
      const value: string = match[i] || ''
      const key = keys[i - 1]
      params[key.name] = value && key.repeatable ? value.split('/') : value
    }

    return params
  }

  function stringify(params: Params): string {
    let path = ''
    let avoidDuplicatedSlash = false
    for (const segment of segments) {
      if (!avoidDuplicatedSlash || path[path.length - 1] !== '/') path += '/'
      avoidDuplicatedSlash = false

      for (const token of segment) {
        const { value } = token
        if (token.type === TokenType.Static) {
          path += value
        } else if (token.type === TokenType.Param) {
          const param: string | string[] = value in params ? params[value] : ''

          if (Array.isArray(param) && !token.repeatable)
            throw new Error(
              `Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`
            )
          const text: string = Array.isArray(param) ? param.join('/') : param
          if (!text) {
            if (!token.optional)
              throw new Error(`Missing required param "${value}"`)
            else avoidDuplicatedSlash = true
          }
          path += text
        }
      }
    }

    return path
  }

  return {
    re,
    score,
    keys,
    parse,
    stringify,
  }
}
