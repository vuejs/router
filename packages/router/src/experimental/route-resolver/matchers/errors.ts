/**
 * Error throw when a matcher matches by regex but validation fails.
 *
 * @internal
 */
export class MatchMiss extends Error {
  name = 'MatchMiss'
}

/**
 * Helper to throw a {@link MatchMiss} error.
 * @param args - Arguments to pass to the `MatchMiss` constructor.
 *
 * @example
 * ```ts
 * miss()
 * // in a number param matcher
 * miss('Number must be finite')
 * ```
 */
export const miss: (
  ...args: ConstructorParameters<typeof MatchMiss>
) => never = (...args) => {
  throw new MatchMiss(...args)
}
