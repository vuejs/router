/**
 * Error throw when a matcher matches by regex but validation fails.
 */
export class MatchMiss extends Error {
  name = 'MatchMiss'
}

/**
 * Helper to create a {@link MatchMiss} error.
 * @param args - Arguments to pass to the `MatchMiss` constructor.
 *
 * @example
 * ```ts
 * throw miss()
 * // in a number param matcher
 * throw miss('Number must be finite')
 * ```
 */
export const miss = (...args: ConstructorParameters<typeof MatchMiss>) =>
  new MatchMiss(...args)
