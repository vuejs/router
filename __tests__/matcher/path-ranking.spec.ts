import {
  tokensToParser,
  tokenizePath,
  comparePathParser,
} from '../../src/matcher/tokenizer'

type PathParserOptions = Parameters<typeof tokensToParser>[1]

describe('Path ranking', () => {
  function checkPathOrder(paths: Array<string | [string, PathParserOptions]>) {
    const pathsAsStrings = paths.map(path =>
      typeof path === 'string' ? path : path[0]
    )
    // reverse the array to force some reordering
    const parsers = paths.reverse().map(path => {
      const parser =
        typeof path === 'string'
          ? tokensToParser(tokenizePath(path))
          : tokensToParser(tokenizePath(path[0]), path[1])
      // @ts-ignore
      parser.path = typeof path === 'string' ? path : path[0]
      return parser
    })

    parsers.sort(comparePathParser)

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
              `${parser.path}: [${parser.score.join(', ')}]`
          )
          .join('\n')
      )
      throw err
    }
  }

  it('orders static before params', () => {
    checkPathOrder(['/a', '/:id'])
  })
})
