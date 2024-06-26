import {
  type LocationQuery,
  parseQuery,
  normalizeQuery,
  stringifyQuery,
} from '../query'
import type { MatcherPattern } from './matcher-pattern'
import { warn } from '../warning'
import {
  SLASH_RE,
  encodePath,
  encodeQueryValue as _encodeQueryValue,
} from '../encoding'
import { parseURL, stringifyURL } from '../location'
import type {
  MatcherLocationAsName,
  MatcherLocationAsRelative,
  MatcherParamsFormatted,
} from './matcher-location'

export type MatcherName = string | symbol

/**
 * Matcher capable of resolving route locations.
 */
export interface NEW_Matcher_Resolve {
  /**
   * Resolves an absolute location (like `/path/to/somewhere`).
   */
  resolve(absoluteLocation: `/${string}`): NEW_MatcherLocationResolved

  /**
   * Resolves a string location relative to another location. A relative location can be `./same-folder`,
   * `../parent-folder`, or even `same-folder`.
   */
  resolve(
    relativeLocation: string,
    currentLocation: NEW_MatcherLocationResolved
  ): NEW_MatcherLocationResolved

  /**
   * Resolves a location by its name. Any required params or query must be passed in the `options` argument.
   */
  resolve(location: MatcherLocationAsName): NEW_MatcherLocationResolved

  /**
   * Resolves a location by its path. Any required query must be passed.
   * @param location - The location to resolve.
   */
  // resolve(location: MatcherLocationAsPath): NEW_MatcherLocationResolved
  // NOTE: in practice, this overload can cause bugs. It's better to use named locations

  /**
   * Resolves a location relative to another location. It reuses existing properties in the `currentLocation` like
   * `params`, `query`, and `hash`.
   */
  resolve(
    relativeLocation: MatcherLocationAsRelative,
    currentLocation: NEW_MatcherLocationResolved
  ): NEW_MatcherLocationResolved

  addRoute(matcher: MatcherPattern, parent?: MatcherPattern): void
  removeRoute(matcher: MatcherPattern): void
  clearRoutes(): void
}

type MatcherResolveArgs =
  | [absoluteLocation: `/${string}`]
  | [relativeLocation: string, currentLocation: NEW_MatcherLocationResolved]
  | [location: MatcherLocationAsName]
  | [
      relativeLocation: MatcherLocationAsRelative,
      currentLocation: NEW_MatcherLocationResolved
    ]

/**
 * Matcher capable of adding and removing routes at runtime.
 */
export interface NEW_Matcher_Dynamic {
  addRoute(record: TODO, parent?: TODO): () => void

  removeRoute(record: TODO): void
  removeRoute(name: MatcherName): void

  clearRoutes(): void
}

type TODO = any

export interface NEW_MatcherLocationResolved {
  name: MatcherName
  fullPath: string
  path: string
  // TODO: generics?
  params: MatcherParamsFormatted
  query: LocationQuery
  hash: string

  matched: TODO[]
}

export type MatcherPathParamsValue = string | null | string[]
/**
 * Params in a string format so they can be encoded/decoded and put into a URL.
 */
export type MatcherPathParams = Record<string, MatcherPathParamsValue>

export type MatcherQueryParamsValue = string | null | Array<string | null>
export type MatcherQueryParams = Record<string, MatcherQueryParamsValue>

export function applyToParams<R>(
  fn: (v: string | number | null | undefined) => R,
  params: MatcherPathParams | LocationQuery | undefined
): Record<string, R | R[]> {
  const newParams: Record<string, R | R[]> = {}

  for (const key in params) {
    const value = params[key]
    newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value)
  }

  return newParams
}

/**
 * Decode text using `decodeURIComponent`. Returns the original text if it
 * fails.
 *
 * @param text - string to decode
 * @returns decoded string
 */
export function decode(text: string | number): string
export function decode(text: null | undefined): null
export function decode(text: string | number | null | undefined): string | null
export function decode(
  text: string | number | null | undefined
): string | null {
  if (text == null) return null
  try {
    return decodeURIComponent('' + text)
  } catch (err) {
    __DEV__ && warn(`Error decoding "${text}". Using original value`)
  }
  return '' + text
}
// TODO: just add the null check to the original function in encoding.ts

interface FnStableNull {
  (value: null | undefined): null
  (value: string | number): string
  // needed for the general case and must be last
  (value: string | number | null | undefined): string | null
}

function encodeParam(text: null | undefined, encodeSlash?: boolean): null
function encodeParam(text: string | number, encodeSlash?: boolean): string
function encodeParam(
  text: string | number | null | undefined,
  encodeSlash?: boolean
): string | null
function encodeParam(
  text: string | number | null | undefined,
  encodeSlash = true
): string | null {
  if (text == null) return null
  text = encodePath(text)
  return encodeSlash ? text.replace(SLASH_RE, '%2F') : text
}

// @ts-expect-error: overload are not correctly identified
const encodeQueryValue: FnStableNull =
  // for ts
  value => (value == null ? null : _encodeQueryValue(value))

// // @ts-expect-error: overload are not correctly identified
// const encodeQueryKey: FnStableNull =
//   // for ts
//   value => (value == null ? null : _encodeQueryKey(value))

function transformObject<T>(
  fnKey: (value: string | number) => string,
  fnValue: FnStableNull,
  query: T
): T {
  const encoded: any = {}

  for (const key in query) {
    const value = query[key]
    encoded[fnKey(key)] = Array.isArray(value)
      ? value.map(fnValue)
      : fnValue(value as string | number | null | undefined)
  }

  return encoded
}

export const NO_MATCH_LOCATION = {
  name: Symbol('no-match'),
  params: {},
  matched: [],
} satisfies Omit<
  NEW_MatcherLocationResolved,
  'path' | 'hash' | 'query' | 'fullPath'
>

export function createCompiledMatcher(): NEW_Matcher_Resolve {
  const matchers = new Map<MatcherName, MatcherPattern>()

  // TODO: allow custom encode/decode functions
  // const encodeParams = applyToParams.bind(null, encodeParam)
  // const decodeParams = transformObject.bind(null, String, decode)
  // const encodeQuery = transformObject.bind(
  //   null,
  //   _encodeQueryKey,
  //   encodeQueryValue
  // )
  // const decodeQuery = transformObject.bind(null, decode, decode)

  function resolve(...args: MatcherResolveArgs): NEW_MatcherLocationResolved {
    const [location, currentLocation] = args
    if (typeof location === 'string') {
      // string location, e.g. '/foo', '../bar', 'baz'
      const url = parseURL(parseQuery, location, currentLocation?.path)

      let matcher: MatcherPattern | undefined
      let parsedParams: MatcherParamsFormatted | null | undefined

      for (matcher of matchers.values()) {
        const params = matcher.matchLocation(url)
        if (params) {
          parsedParams = matcher.formatParams(
            transformObject(String, decode, params[0]),
            // already decoded
            params[1],
            params[2]
          )
          if (parsedParams) break
        }
      }

      // No match location
      if (!parsedParams || !matcher) {
        return {
          ...url,
          ...NO_MATCH_LOCATION,
          // already decoded
          query: url.query,
          hash: url.hash,
        }
      }

      return {
        ...url,
        name: matcher.name,
        params: parsedParams,
        // already decoded
        query: url.query,
        hash: url.hash,
        matched: [],
      }
    } else {
      // relative location or by name
      const name = location.name ?? currentLocation!.name
      const matcher = matchers.get(name)
      if (!matcher) {
        throw new Error(`Matcher "${String(location.name)}" not found`)
      }

      // unencoded params in a formatted form that the user came up with
      const params = location.params ?? currentLocation!.params
      const mixedUnencodedParams = matcher.unformatParams(params)

      const path = matcher.buildPath(
        // encode the values before building the path
        transformObject(String, encodeParam, mixedUnencodedParams[0])
      )

      // TODO: should pick query from the params but also from the location and merge them
      const query = {
        ...normalizeQuery(location.query),
        // ...matcher.extractQuery(mixedUnencodedParams[1])
      }
      const hash = mixedUnencodedParams[2] ?? location.hash ?? ''

      return {
        name,
        fullPath: stringifyURL(stringifyQuery, { path, query: {}, hash }),
        path,
        params,
        hash,
        query,
        matched: [],
      }
    }
  }

  function addRoute(matcher: MatcherPattern, parent?: MatcherPattern) {
    matchers.set(matcher.name, matcher)
  }

  function removeRoute(matcher: MatcherPattern) {
    matchers.delete(matcher.name)
    // TODO: delete children and aliases
  }

  function clearRoutes() {
    matchers.clear()
  }

  return {
    resolve,

    addRoute,
    removeRoute,
    clearRoutes,
  }
}
