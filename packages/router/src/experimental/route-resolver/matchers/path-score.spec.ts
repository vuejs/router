import { describe, expect, it } from 'vitest'
import { parseClassicPath } from './matcher-pattern-path-classic'
import { MatcherPatternPathDynamic } from './matcher-pattern'
import { comparePathScore, getPathScore } from './path-score'

function scoreOf(path: string) {
  const pattern = parseClassicPath(path)
  return pattern instanceof MatcherPatternPathDynamic
    ? getPathScore(pattern.pathParts, Object.values(pattern.params))
    : getPathScore(pattern.path.split('/').filter(Boolean), [])
}

describe('path score', () => {
  it('ranks paths like the classic matcher', () => {
    const ranked = [
      '/users/list',
      '/users/:id',
      '/users/:id?',
      '/users/:ids+',
      '/users/:ids*',
      '/users',
      '/:a-:b',
      '/:a',
      '/:a?',
      '/:pathMatch(.*)',
    ]
    const shuffled = [...ranked].reverse()
    shuffled.sort((a, b) => comparePathScore(scoreOf(a), scoreOf(b)))
    expect(shuffled).toEqual(ranked)
  })

  it('ranks the root path before optional params', () => {
    expect(comparePathScore(scoreOf('/'), scoreOf('/:a?'))).toBeLessThan(0)
    expect(comparePathScore(scoreOf('/'), scoreOf('/:a*'))).toBeLessThan(0)
  })

  it('ranks a trailing splat after a path with one segment less', () => {
    expect(
      comparePathScore(scoreOf('/users/:pathMatch(.*)'), scoreOf('/users'))
    ).toBeGreaterThan(0)
    expect(
      comparePathScore(scoreOf('/users/:pathMatch(.*)'), scoreOf('/:id'))
    ).toBeLessThan(0)
  })
})
