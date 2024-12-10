import {
  PathParser,
  PathParserOptions,
  PathScore,
  BASE_PATH_PARSER_OPTIONS,
} from './pathParserRanker'
import { Token } from './pathTokenizer'
import { assign } from '../utils'

export function staticPathToParser(
  path: string,
  tokens: Array<Token[]>,
  extraOptions?: PathParserOptions
): PathParser {
  const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions)

  const matchPath = options.sensitive ? path : path.toUpperCase()

  let test: (p: string) => boolean

  if (options.strict) {
    if (options.sensitive) {
      test = p => p === matchPath
    } else {
      test = p => p.toUpperCase() === matchPath
    }
  } else {
    const withSlash = matchPath.endsWith('/') ? matchPath : matchPath + '/'
    const withoutSlash = withSlash.slice(0, -1)

    if (options.sensitive) {
      test = p => p === withSlash || p === withoutSlash
    } else {
      test = p => {
        p = p.toUpperCase()
        return p === withSlash || p === withoutSlash
      }
    }
  }

  const score: Array<number[]> = tokens.map(segment => {
    if (segment.length === 1) {
      return [
        PathScore.Static +
          PathScore.Segment +
          (options.sensitive ? PathScore.BonusCaseSensitive : 0),
      ]
    } else {
      return [PathScore.Root]
    }
  })

  if (options.strict && options.end) {
    const i = score.length - 1
    score[i][score[i].length - 1] += PathScore.BonusStrict
  }

  return {
    re: {
      test,
    },
    score,
    keys: [],
    parse() {
      return {}
    },
    stringify() {
      return path || '/'
    },
  }
}
