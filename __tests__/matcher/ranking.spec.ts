import { createRouteMatcher } from '../../src/matcher/path-ranker'
import { RegExpOptions } from 'path-to-regexp'
import { RouteComponent } from '../../src/types'
import { RouteRecordMatcher } from '../../src/matcher/types'

// @ts-ignore
const component: RouteComponent = null

function stringifyOptions(options: any) {
  return Object.keys(options).length ? ` (${JSON.stringify(options)})` : ''
}

describe('createRouteMatcher', () => {
  function checkPathOrder(
    paths: Array<string | [string, RegExpOptions]>,
    options: RegExpOptions = {}
  ) {
    const normalizedPaths = paths.map(pathOrCombined => {
      if (Array.isArray(pathOrCombined))
        return [pathOrCombined[0], { ...options, ...pathOrCombined[1] }]
      return [pathOrCombined, options]
    })

    const matchers: Array<
      RouteRecordMatcher & { _options: RegExpOptions }
    > = normalizedPaths
      .slice()
      // Because sorting order is conserved, allows to mismatch order on
      // routes with the same ranking
      .reverse()
      .map(([path, options]) => ({
        ...createRouteMatcher(
          {
            // @ts-ignore types are correct
            path,
            components: { default: component },
          },
          null,
          options
        ),
        // add original options
        _options: options,
      }))
      .sort((a, b) => b.score - a.score)

    expect(matchers.map(matcher => matcher.record.path)).toEqual(
      normalizedPaths.map(([path]) => path)
    )

    // Fail if two consecutive records have the same record
    for (let i = 1; i < matchers.length; i++) {
      const a = matchers[i - 1]
      const b = matchers[i]
      try {
        expect(a.score).not.toBe(b.score)
      } catch (e) {
        throw new Error(
          `Record "${a.record.path}"${stringifyOptions(
            matchers[i - 1]._options
          )} and "${b.record.path}"${stringifyOptions(
            matchers[i]._options
          )} have the same score: ${
            a.score
          }. Avoid putting routes with the same score on the same test`
        )
      }
    }
  }

  it('orders a rest param with root', () => {
    checkPathOrder(['/a/', '/a/:w(.*)', '/a'])
  })

  it('orders sub segments with params', () => {
    checkPathOrder(['/a-b-c', '/a-:b-c', '/a-:b-:c', '/a-:b'])
  })

  it('works', () => {
    checkPathOrder([
      '/a/b/c',
      '/a/:b/c',
      '/a/b',
      '/a/:b',
      '/:a/-:b',
      '/:a/:b',
      '/a',
      '/a-:b',
      '/a-:w(.*)',
      '/:a-b',
      '/:a-:b-:c',
      '/:a-:b',
      '/:a-:b(.*)',
      '/:w',
      '/:w+',
      '/',
    ])
  })

  it('puts the wildcard at the end', () => {
    checkPathOrder(['/', '/:rest(.*)'])
  })

  it('prioritises custom regex', () => {
    checkPathOrder(['/:a(\\d+)', '/:a', '/:a(.*)'])
    checkPathOrder(['/b-:a(\\d+)', '/b-:a', '/b-:a(.*)'])
  })

  it('handles sub segments optional params', () => {
    // TODO: /a/c should be be bigger than /a/c/:b?
    checkPathOrder(['/a/d/c', '/a/b/c:b', '/a/c/:b', '/a/c/:b?', '/a/c'])
  })

  it('handles optional in sub segments', () => {
    checkPathOrder([
      '/a/_2_',
      // something like /a/_23_
      '/a/_:b(\\d)?_',
      '/a/_:b\\_', // the _ is escaped but b can be also letters
      '/a/a_:b',
    ])
  })

  it('works with long paths', () => {
    checkPathOrder([
      '/a/b/c/d/e',
      '/:k-foo/b/c/d/e',
      '/:k/b/c/d/e',
      '/:k/b/c/d/:j',
    ])
  })

  it('ending slashes less than params', () => {
    checkPathOrder([
      ['/a/:b/', { strict: true }],
      ['/a/b', { strict: false }],
      ['/a/:b', { strict: true }],
    ])
  })

  it('prioritizes ending slashes', () => {
    checkPathOrder([
      // no strict
      '/a/b/',
      '/a/b',
      '/a/',
      '/a',
    ])

    checkPathOrder([
      ['/a/b/', { strict: true }],
      '/a/b/',
      ['/a/b', { strict: true }],
      '/a/b',
      ['/a/', { strict: true }],
      '/a/',
      ['/a', { strict: true }],
      '/a',
    ])
  })

  it('prioritizes case sensitive', () => {
    checkPathOrder([
      ['/a/', { sensitive: true }],
      '/a/', // explicit ending slash
      ['/a', { sensitive: true }],
      '/a', // also matches /A
    ])
  })

  it('ranks repeated params properly', () => {
    checkPathOrder([
      '/:a',
      '/:a+',
      '/:a?',
      '/:a*',
      // FIXME: this one should appear here but it appears before /:a*
      // '/:a(.*)'
    ])
  })
})
