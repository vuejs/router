// @ts-check
require('./helper')
const expect = require('expect')
const { createRouteMatcher } = require('../src/matcher')
const { START_LOCATION_NORMALIZED } = require('../src/types')
const { normalizeRouteRecord } = require('./utils')

/** @type {RouteComponent} */
const component = null

/** @typedef {import('../src/types').RouteRecord} RouteRecord */
/** @typedef {import('../src/types').RouteComponent} RouteComponent */
/** @typedef {import('../src/types').MatchedRouteRecord} MatchedRouteRecord */
/** @typedef {import('../src/types').MatcherLocation} MatcherLocation */
/** @typedef {import('../src/types').MatcherLocationRedirect} MatcherLocationRedirect */
/** @typedef {import('../src/types').MatcherLocationNormalized} MatcherLocationNormalized */
/** @typedef {import('path-to-regexp').RegExpOptions} RegExpOptions */

describe('createRouteMatcher', () => {
  /**
   *
   * @param {string[]} paths
   * @param {RegExpOptions} options
   */
  function checkPathOrder(paths, options = {}) {
    const matchers = paths
      .slice()
      // Because sorting order is conserved, allows to mismatch order on
      // routes with the same ranking
      .reverse()
      .map(path =>
        createRouteMatcher(
          {
            path,
            components: { default: component },
          },
          null,
          options
        )
      )
      .sort((a, b) => b.score - a.score)
      .map(matcher => matcher.record.path)
    expect(matchers).toEqual(paths)
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
})
