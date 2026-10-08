import { describe, expect, it } from 'vitest'
import {
  comparePathScore,
  getPathScore,
  type PathScoreParamOptions,
  type PathScoreParts,
} from './path-score'

type Path = [parts: PathScoreParts, params?: PathScoreParamOptions[]]

/**
 * Sorts the paths and returns their indexes in the sorted order.
 */
function sortPaths(...paths: Path[]): number[] {
  return paths
    .map(([parts, params = []], i) => ({
      i,
      score: getPathScore(parts, params),
    }))
    .sort((a, b) => comparePathScore(a.score, b.score))
    .map(({ i }) => i)
}

const PARAM: PathScoreParamOptions = []
const OPTIONAL: PathScoreParamOptions = [, false, true]
const REPEATABLE: PathScoreParamOptions = [, true]
const STAR: PathScoreParamOptions = [, true, true]

describe('path score', () => {
  it('sorts static before params', () => {
    // /users/:id, /users/new
    expect(sortPaths([['users', 1], [PARAM]], [['users', 'new']])).toEqual([
      1, 0,
    ])
  })

  it('sorts params before optional and repeatable params', () => {
    // /:p*, /:p+, /:p?, /:p
    expect(
      sortPaths(
        [[1], [STAR]],
        [[1], [REPEATABLE]],
        [[1], [OPTIONAL]],
        [[1], [PARAM]]
      )
    ).toEqual([3, 2, 1, 0])
  })

  it('sorts splats last', () => {
    // /:path(.*), /:id, /
    expect(sortPaths([[0], [PARAM]], [[1], [PARAM]], [[]])).toEqual([2, 1, 0])
  })

  it('sorts a splat after the path without it', () => {
    // /users/:path(.*), /users
    expect(sortPaths([['users', 0], [PARAM]], [['users']])).toEqual([1, 0])
  })

  it('sorts the root before root optional params', () => {
    // /:p?, /
    expect(sortPaths([[1], [OPTIONAL]], [[]])).toEqual([1, 0])
    // /:p*, /
    expect(sortPaths([[1], [STAR]], [[]])).toEqual([1, 0])
  })

  it('sorts longer paths first', () => {
    // /a, /a/b
    expect(sortPaths([['a']], [['a', 'b']])).toEqual([1, 0])
  })

  it('sorts static segments before segments with params', () => {
    // /prefix-:id, /prefix-static
    expect(sortPaths([[['prefix-', 1]], [PARAM]], [['prefix-static']])).toEqual(
      [1, 0]
    )
  })

  it('keeps equal scores as equal', () => {
    // /:a, /:b
    const a = getPathScore([1], [PARAM])
    const b = getPathScore([1], [PARAM])
    expect(comparePathScore(a, b)).toBe(0)
  })
})
