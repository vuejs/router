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

  const possibleOptions: PathParserOptions[] = [
    undefined,
    { strict: true, sensitive: false },
    { strict: false, sensitive: true },
    { strict: true, sensitive: true },
  ]

  function checkPathOrder(paths: Array<string | [string, PathParserOptions]>) {
    const normalizedPaths = paths.map(pathOrArray => {
      let path: string
      let options: PathParserOptions
      if (typeof pathOrArray === 'string') {
        path = pathOrArray
      } else {
        path = pathOrArray[0]
        options = pathOrArray[1]
      }

      return {
        id: path + (options ? JSON.stringify(options) : ''),
        path,
        options,
      }
    })

    // reverse the array to force some reordering
    const parsers = normalizedPaths
      .slice()
      .reverse()
      .map(({ id, path, options }) => ({
        ...tokensToParser(tokenizePath(path), options),
        id,
      }))

    parsers.sort((a, b) => comparePathParserScore(a.score, b.score))

    for (let i = 0; i < parsers.length - 1; i++) {
      const a = parsers[i]
      const b = parsers[i + 1]

      try {
        expect(a.score).not.toEqual(b.score)
      } catch (err) {
        console.warn(
          'Different routes should not have the same score:\n' +
            `${a.id} -> [${a.score.join(', ')}]\n${b.id} -> [${b.score.join(
              ', '
            )}]`
        )

        throw err
      }
    }

    try {
      expect(parsers.map(parser => parser.id)).toEqual(
        normalizedPaths.map(path => path.id)
      )
    } catch (err) {
      console.warn(
        parsers
          .map(parser => `${parser.id} -> [${parser.score.join(', ')}]`)
          .join('\n')
      )
      throw err
    }
  }

  it('works', () => {
    checkPathOrder([
      '/a/b/c',
      '/a/b',
      '/a/:b/c',
      '/a/:b',
      '/a',
      '/:a/:b',
      '/:w',
      '/:w+',
      // '/:a/-:b',
      // '/:a/:b',
      // '/a-:b',
      // '/a-:w(.*)',
      // '/:a-b',
      // '/:a-:b-:c',
      // '/:a-:b',
      // '/:a-:b(.*)',
    ])
  })

  it('puts the slash before optional paramateres', () => {
    possibleOptions.forEach(options => {
      checkPathOrder(['/', ['/:a?', options]])
      checkPathOrder(['/', ['/:a*', options]])
      checkPathOrder(['/', ['/:a(\\d+)?', options]])
      checkPathOrder(['/', ['/:a(\\d+)*', options]])
    })
  })

  it('sensitive should go before non sensitive', () => {
    checkPathOrder([
      ['/Home', { sensitive: true }],
      ['/home', {}],
    ])
    checkPathOrder([
      ['/:w', { sensitive: true }],
      ['/:w', {}],
    ])
  })

  it('strict should go before non strict', () => {
    checkPathOrder([
      ['/home', { strict: true }],
      ['/home', {}],
    ])
  })

  it('orders repeteable and optional', () => {
    possibleOptions.forEach(options => {
      checkPathOrder(['/:w', ['/:w?', options]])
      checkPathOrder(['/:w?', ['/:w+', options]])
      checkPathOrder(['/:w?', ['/:w*', options]])
    })
  })

  it('orders static before params', () => {
    possibleOptions.forEach(options => {
      checkPathOrder(['/a', ['/:id', options]])
    })
  })

  it('empty path before slash', () => {
    possibleOptions.forEach(options => {
      checkPathOrder(['', ['/', options]])
    })
  })

  it('works with long paths', () => {
    checkPathOrder(['/a/b/c/d/e', '/:k/b/c/d/e', '/:k/b/c/d/:j'])
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

    checkPathOrder([['/a/', { strict: true }], '/a/'])
    checkPathOrder([['/a', { strict: true }], '/a'])
  })

  it('puts the wildcard at the end', () => {
    possibleOptions.forEach(options => {
      checkPathOrder([['', options], '/:rest(.*)'])
      checkPathOrder([['/', options], '/:rest(.*)'])
      checkPathOrder([['/ab', options], '/:rest(.*)'])
      checkPathOrder([['/:a', options], '/:rest(.*)'])
      checkPathOrder([['/:a?', options], '/:rest(.*)'])
      checkPathOrder([['/:a+', options], '/:rest(.*)'])
      checkPathOrder([['/:a*', options], '/:rest(.*)'])
      checkPathOrder([['/:a(\\d+)', options], '/:rest(.*)'])
      checkPathOrder([['/:a(\\d+)?', options], '/:rest(.*)'])
      checkPathOrder([['/:a(\\d+)+', options], '/:rest(.*)'])
      checkPathOrder([['/:a(\\d+)*', options], '/:rest(.*)'])
    })
  })
})
