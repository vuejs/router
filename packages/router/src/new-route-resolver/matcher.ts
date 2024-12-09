import {
  type LocationQuery,
  parseQuery,
  normalizeQuery,
  stringifyQuery,
} from '../query'
import type {
  MatcherPattern,
  MatcherPatternHash,
  MatcherPatternPath,
  MatcherPatternQuery,
} from './new-matcher-pattern'
import { warn } from '../warning'
import {
  SLASH_RE,
  encodePath,
  encodeQueryValue as _encodeQueryValue,
} from '../encoding'
import { parseURL, stringifyURL } from '../location'
import type {
  MatcherLocationAsNamed,
  MatcherLocationAsRelative,
  MatcherParamsFormatted,
} from './matcher-location'
import { RouteRecordRaw } from 'test-dts'

/**
 * Allowed types for a matcher name.
 */
export type MatcherName = string | symbol

/**
 * Manage and resolve routes. Also handles the encoding, decoding, parsing and serialization of params, query, and hash.
 */
export interface RouteResolver<Matcher, MatcherNormalized> {
  /**
   * Resolves an absolute location (like `/path/to/somewhere`).
   */
  resolve(absoluteLocation: `/${string}`): NEW_LocationResolved

  /**
   * Resolves a string location relative to another location. A relative location can be `./same-folder`,
   * `../parent-folder`, `same-folder`, or even `?page=2`.
   */
  resolve(
    relativeLocation: string,
    currentLocation: NEW_LocationResolved
  ): NEW_LocationResolved

  /**
   * Resolves a location by its name. Any required params or query must be passed in the `options` argument.
   */
  resolve(location: MatcherLocationAsNamed): NEW_LocationResolved

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
    currentLocation: NEW_LocationResolved
  ): NEW_LocationResolved

  addRoute(matcher: Matcher, parent?: MatcherNormalized): MatcherNormalized
  removeRoute(matcher: MatcherNormalized): void
  clearRoutes(): void
}

type MatcherResolveArgs =
  | [absoluteLocation: `/${string}`]
  | [relativeLocation: string, currentLocation: NEW_LocationResolved]
  | [location: MatcherLocationAsNamed]
  | [
      relativeLocation: MatcherLocationAsRelative,
      currentLocation: NEW_LocationResolved
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

export interface NEW_LocationResolved {
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

/**
 * Apply a function to all properties in an object. It's used to encode/decode params and queries.
 * @internal
 */
export function applyFnToObject<R>(
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
  name: __DEV__ ? Symbol('no-match') : Symbol(),
  params: {},
  matched: [],
} satisfies Omit<NEW_LocationResolved, 'path' | 'hash' | 'query' | 'fullPath'>

// FIXME: later on, the MatcherRecord should be compatible with RouteRecordRaw (which can miss a path, have children, etc)

export interface MatcherRecordRaw {
  name?: MatcherName

  path: MatcherPatternPath

  query?: MatcherPatternQuery

  hash?: MatcherPatternHash

  children?: MatcherRecordRaw[]
}

// const a: RouteRecordRaw = {} as any

/**
 * Build the `matched` array of a record that includes all parent records from the root to the current one.
 */
function buildMatched(record: MatcherPattern): MatcherPattern[] {
  const matched: MatcherPattern[] = []
  let node: MatcherPattern | undefined = record
  while (node) {
    matched.unshift(node)
    node = node.parent
  }
  return matched
}

export function createCompiledMatcher(): RouteResolver<
  MatcherRecordRaw,
  MatcherPattern
> {
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

  function resolve(...args: MatcherResolveArgs): NEW_LocationResolved {
    const [location, currentLocation] = args

    // string location, e.g. '/foo', '../bar', 'baz', '?page=1'
    if (typeof location === 'string') {
      const url = parseURL(parseQuery, location, currentLocation?.path)

      let matcher: MatcherPattern | undefined
      let matched: NEW_LocationResolved['matched'] | undefined
      let parsedParams: MatcherParamsFormatted | null | undefined

      for (matcher of matchers.values()) {
        // match the path because the path matcher only needs to be matched here
        // match the hash because only the deepest child matters
        // End up by building up the matched array, (reversed so it goes from
        // root to child) and then match and merge all queries
        try {
          const pathParams = matcher.path.match(url.path)
          const hashParams = matcher.hash?.match(url.hash)
          matched = buildMatched(matcher)
          const queryParams: MatcherQueryParams = Object.assign(
            {},
            ...matched.map(matcher => matcher.query?.match(url.query))
          )
          // TODO: test performance
          // for (const matcher of matched) {
          //   Object.assign(queryParams, matcher.query?.match(url.query))
          // }

          parsedParams = { ...pathParams, ...queryParams, ...hashParams }
          // console.log('parsedParams', parsedParams)

          if (parsedParams) break
        } catch (e) {
          // for debugging tests
          // console.log('❌ ERROR matching', e)
        }
      }

      // No match location
      if (!parsedParams || !matched) {
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
        // matcher exists if matched exists
        name: matcher!.name,
        params: parsedParams,
        // already decoded
        query: url.query,
        hash: url.hash,
        matched,
      }
    } else {
      // relative location or by name
      if (__DEV__ && location.name == null && currentLocation == null) {
        console.warn(
          `Cannot resolve an unnamed relative location without a current location. This will throw in production.`,
          location
        )
        return {
          ...NO_MATCH_LOCATION,
          fullPath: '/',
          path: '/',
          query: {},
          hash: '',
        }
      }

      // either one of them must be defined and is catched by the dev only warn above
      const name = location.name ?? currentLocation!.name
      const matcher = matchers.get(name)
      if (!matcher) {
        throw new Error(`Matcher "${String(location.name)}" not found`)
      }

      // unencoded params in a formatted form that the user came up with
      const params: MatcherParamsFormatted = {
        ...currentLocation?.params,
        ...location.params,
      }
      const path = matcher.path.build(params)
      const hash = matcher.hash?.build(params) ?? ''
      const matched = buildMatched(matcher)
      const query = Object.assign(
        {
          ...currentLocation?.query,
          ...normalizeQuery(location.query),
        },
        ...matched.map(matcher => matcher.query?.build(params))
      )

      return {
        name,
        fullPath: stringifyURL(stringifyQuery, { path, query, hash }),
        path,
        query,
        hash,
        params,
        matched,
      }
    }
  }

  function addRoute(record: MatcherRecordRaw, parent?: MatcherPattern) {
    const name = record.name ?? (__DEV__ ? Symbol('unnamed-route') : Symbol())
    // FIXME: proper normalization of the record
    const normalizedRecord: MatcherPattern = {
      ...record,
      name,
      parent,
    }
    matchers.set(name, normalizedRecord)
    return normalizedRecord
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
