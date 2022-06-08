import { tokenizePath } from '../../src/matcher/pathTokenizer'
import {
  tokensToParser,
  comparePathParserScore,
} from '../../src/matcher/pathParserRanker'

type PathParserOptions = Parameters<typeof tokensToParser>[1]

describe('Path ranking', () => {
  describe('comparePathParser', () => {
    function compare(a: number[][], b: number[][]): number {
      return comparePathParserScore(
        {
          score: a,
          re: /a/,
          // @ts-expect-error
          stringify: v => v,
          // @ts-expect-error
          parse: v => v,
          keys: [],
        },
        {
          score: b,
          re: /a/,
          stringify: v => v,
          parse: v => v,
          keys: [],
        }
      )
    }

    it('same length', () => {
      expect(compare([[2]], [[3]])).toEqual(1)
      expect(compare([[2]], [[2]])).toEqual(0)
      expect(compare([[4]], [[3]])).toEqual(-1)
    })
    it('longer', () => {
      expect(compare([[2]], [[3, 1]])).toEqual(1)
      // NOTE: we are assuming we never pass end: false
      expect(compare([[3]], [[3, 1]])).toEqual(1)
      expect(compare([[1, 3]], [[2]])).toEqual(1)
      expect(compare([[4]], [[3]])).toEqual(-1)
      expect(compare([], [[3]])).toEqual(1)
    })
  })

  const possibleOptions: PathParserOptions[] = [
    undefined,
    { strict: true, sensitive: false },
    { strict: false, sensitive: true },
    { strict: true, sensitive: true },
  ]

  function joinScore(score: number[][]): string {
    return score.map(s => `[${s.join(', ')}]`).join(' ')
  }

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

    parsers.sort((a, b) => comparePathParserScore(a, b))

    for (let i = 0; i < parsers.length - 1; i++) {
      const a = parsers[i]
      const b = parsers[i + 1]

      try {
        expect(a.score).not.toEqual(b.score)
      } catch (err) {
        console.warn(
          'Different routes should not have the same score:\n' +
            `${a.id} -> ${joinScore(a.score)}\n${b.id} -> ${joinScore(b.score)}`
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
          .map(parser => `${parser.id} -> ${joinScore(parser.score)}`)
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
      '/a-:b-:c',
      '/a-:b',
      '/a-:w(.*)',
      '/:a-:b-:c',
      '/:a-:b',
      '/:a-:b(.*)',
      '/:a/-:b',
      '/:a/:b',
      '/:w',
      '/:w+',
    ])
  })

  it('puts the slash before optional parameters', () => {
    possibleOptions.forEach(options => {
      checkPathOrder(['/', ['/:a?', options]])
      checkPathOrder(['/', ['/:a*', options]])
      checkPathOrder(['/', ['/:a(\\d+)?', options]])
      checkPathOrder(['/', ['/:a(\\d+)*', options]])
    })
  })

  it('puts catchall param after same prefix', () => {
    possibleOptions.forEach(options => {
      checkPathOrder([
        ['/a', options],
        ['/a/:a(.*)*', options],
      ])
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

  it('orders repeatable and optional', () => {
    possibleOptions.forEach(options => {
      checkPathOrder(['/:w', ['/:w?', options]])
      checkPathOrder(['/:w?', ['/:w+', options]])
      checkPathOrder(['/:w+', ['/:w*', options]])
      checkPathOrder(['/:w+', ['/:w(.*)', options]])
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

  it('prioritizes custom regex', () => {
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

  it('handles sub segments', () => {
    checkPathOrder([
      '/a/_2_',
      // something like /a/_23_
      '/a/_:b(\\d)other',
      '/a/_:b(\\d)?other',
      '/a/_:b-other', // the _ is escaped but b can be also letters
      '/a/a_:b',
    ])
  })

  it('handles repeatable and optional in sub segments', () => {
    checkPathOrder([
      '/a/_:b-other',
      '/a/_:b?-other',
      '/a/_:b+-other',
      '/a/_:b*-other',
    ])
    checkPathOrder([
      '/a/_:b(\\d)-other',
      '/a/_:b(\\d)?-other',
      '/a/_:b(\\d)+-other',
      '/a/_:b(\\d)*-other',
    ])
  })

  it('ending slashes less than params', () => {
    checkPathOrder([
      ['/a/b', { strict: false }],
      ['/a/:b', { strict: true }],
      ['/a/:b/', { strict: true }],
    ])
  })
})
