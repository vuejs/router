/**
 * NOTE: for these classes to keep the same code we need to tell TS with `"useDefineForClassFields": true` in the `tsconfig.json`
 */

/**
 * Error throw when a matcher miss
 */
export class MatchMiss extends Error {
  name = 'MatchMiss'
}

// NOTE: not sure about having a helper. Using `new MatchMiss(description?)` is good enough
export const miss = () => new MatchMiss()

/**
 * Error throw when a param is invalid when parsing params from path, query, or hash.
 */
export class ParamInvalid extends Error {
  name = 'ParamInvalid'
  constructor(public param: string) {
    super()
  }
}
export const invalid = (param: string) => new ParamInvalid(param)
