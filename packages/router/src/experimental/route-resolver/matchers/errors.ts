/**
 * Thrown by param parsers when a value doesn't match. It does not extend
 * `Error` on purpose: creating a stack trace for every miss is slow.
 *
 * @internal
 */
export class MatchMiss {
  constructor(public message?: string) {}
}

/**
 * Helper to throw a {@link MatchMiss} from a param parser `get()`. Matchers
 * (`match()` of path, query, and hash) return `null` instead, which is faster.
 * @param args - Arguments to pass to the `MatchMiss` constructor.
 *
 * @example
 * ```ts
 * miss()
 * // in a number param parser
 * miss('Number must be finite')
 * ```
 */
export const miss: (
  ...args: ConstructorParameters<typeof MatchMiss>
) => never = (...args) => {
  throw new MatchMiss(...args)
}
