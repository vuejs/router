import { tokensToParser, tokenizePath } from '../../src/matcher/tokenizer'
import { comparePathParserScore } from '../../src/matcher/path-ranker'

type PathParserOptions = Parameters<typeof tokensToParser>[1]

describe('Path ranking', () => {
  describe('comparePathParser', () => {
    it('same length', () => {
      expect(comparePathParserScore([2], [3])).toEqual(1)
      expect(comparePathParserScore([2], [2])).toEqual(0)
      expect(comparePathParserScore([4], [3])).toEqual(-1)
    })

    it('longer', () => {
      expect(comparePathParserScore([2], [3, 1])).toEqual(1)
      // TODO: we are assuming we never pass end: false
      expect(comparePathParserScore([3], [3, 1])).toEqual(1)
      expect(comparePathParserScore([1, 3], [2])).toEqual(1)
      expect(comparePathParserScore([4], [3])).toEqual(-1)
      expect(comparePathParserScore([], [3])).toEqual(1)
    })
  })

  function checkPathOrder(paths: Array<string | [string, PathParserOptions]>) {
    const pathsAsStrings = paths.map(path =>
      typeof path === 'string' ? path : path[0] + JSON.stringify(path[1])
    )
    // reverse the array to force some reordering
    const parsers = paths.reverse().map(path => {
      const parser =
        typeof path === 'string'
          ? tokensToParser(tokenizePath(path))
          : tokensToParser(tokenizePath(path[0]), path[1])
      // @ts-ignore
      parser.path =
        typeof path === 'string' ? path : path[0] + JSON.stringify(path[1])
      return parser
    })

    parsers.sort((a, b) => comparePathParserScore(a.score, b.score))

    try {
      expect(
        parsers.map(
          parser =>
            // @ts-ignore
            parser.path
        )
      ).toEqual(pathsAsStrings)
    } catch (err) {
      console.log(
        parsers
          .map(
            parser =>
              // @ts-ignore
              `${parser.path} -> [${parser.score.join(', ')}]`
          )
          .join('\n')
      )
      throw err
    }
  }

  it('orders static before params', () => {
    checkPathOrder(['/a', '/:id'])
  })

  it('empty path before slash', () => {
    checkPathOrder(['', '/'])
  })

  it('works with long paths', () => {
    checkPathOrder(['/a/b/c/d/e', '/:k/b/c/d/e', '/:k/b/c/d/:j'])
  })

  it('puts the wildcard at the end', () => {
    checkPathOrder(['/', '/:rest(.*)'])
    checkPathOrder(['/static', '/:rest(.*)'])
    checkPathOrder(['/:other', '/:rest(.*)'])
  })

  it('prioritises custom regex', () => {
    checkPathOrder(['/:a(\\d+)', '/:a', '/:a(.*)'])
    checkPathOrder(['/b-:a(\\d+)', '/b-:a', '/b-:a(.*)'])
  })

  it('prioritizes ending slashes', () => {
    checkPathOrder([
      // no strict
      '/a/',
      '/a',
    ])
    checkPathOrder([
      // no strict
      '/a/b/',
      '/a/b',
    ])

    // does this really make sense?
    // checkPathOrder([['/a/', { strict: true }], '/a/'])
    // checkPathOrder([['/a', { strict: true }], '/a'])
  })
})
