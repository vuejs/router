/**
 * Score of a path used to rank routes. Each entry is a segment and each
 * segment has one score per sub segment (e.g. `/prefix-:id` has two).
 */
export type PathScore = number[][]

/**
 * Parts of a path, as passed to `MatcherPatternPathDynamic`: strings are
 * static parts, `1` are params, `0` are splat params, and arrays are segments
 * with multiple sub segments.
 */
export type PathScoreParts = ReadonlyArray<
  string | number | ReadonlyArray<string | number>
>

/**
 * Minimal param options needed to compute a score, in order of appearance:
 * `[parser, repeatable, optional]` like `MatcherPatternPathDynamic_ParamOptions`.
 */
export type PathScoreParamOptions = readonly [
  parser?: unknown,
  repeatable?: boolean,
  optional?: boolean,
]

const enum Score {
  Static = 300,
  Param = 80,
  Optional = 10,
  Repeatable = 20,
  Splat = 500,
}

/**
 * Computes the score of a path. Used by the codegen to sort the generated
 * records and at runtime to insert records in a dynamic resolver.
 *
 * @param pathParts - parts of the path
 * @param params - param options in the order they appear in the path
 */
export function getPathScore(
  pathParts: PathScoreParts,
  params: readonly PathScoreParamOptions[]
): PathScore {
  let paramIndex = 0
  const partScore = (part: string | number): number => {
    if (typeof part === 'string') return Score.Static
    const [, repeatable, optional] = params[paramIndex++] || []
    return (
      Score.Param -
      (part === 0
        ? Score.Splat
        : (optional ? Score.Optional : 0) + (repeatable ? Score.Repeatable : 0))
    )
  }

  return pathParts.length
    ? pathParts.map(part =>
        typeof part === 'object' ? part.map(partScore) : [partScore(part)]
      )
    : // the root path `/` is a static segment
      [[Score.Static]]
}

/**
 * Compares two segment scores.
 */
function compareSegmentScore(a: number[], b: number[]): number {
  let i = 0
  while (i < a.length && i < b.length) {
    const diff = b[i] - a[i]
    if (diff) return diff
    i++
  }

  // if the shorter segment is fully static, it should sort first
  // otherwise sort the longer segment first
  if (a.length < b.length) {
    return a.length === 1 && a[0] === Score.Static ? -1 : 1
  } else if (a.length > b.length) {
    return b.length === 1 && b[0] === Score.Static ? 1 : -1
  }

  return 0
}

function isLastScoreNegative(score: PathScore): boolean {
  const last = score[score.length - 1]
  return score.length > 0 && last[last.length - 1] < 0
}

/**
 * Compares two path scores. Can be passed to `Array.prototype.sort()`.
 *
 * @returns a negative number if `a` should be sorted first, a positive number
 * if `b` should be sorted first, and `0` if they are equal
 */
export function comparePathScore(a: PathScore, b: PathScore): number {
  let i = 0
  while (i < a.length && i < b.length) {
    const comp = compareSegmentScore(a[i], b[i])
    if (comp) return comp
    i++
  }

  // a trailing splat sorts after a path with one segment less
  if (Math.abs(b.length - a.length) === 1) {
    if (isLastScoreNegative(a)) return 1
    if (isLastScoreNegative(b)) return -1
  }

  // more segments are more specific
  return b.length - a.length
}
