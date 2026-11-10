import {
  experimental_normalizeQuery as normalizeQuery,
  experimental_parseQuery as parseQuery,
  warnNonArrayQueryValues,
} from '../query'
import { stringifyQuery } from '../../query'
import {
  experimental_parseURL as parseURL,
  experimental_stringifyURL as stringifyURL,
} from '../location'
import { encodeHash } from '../encoding'
import { type LocationNormalized, resolveRelativePath } from '../../location'
import type {
  MatcherPatternPath,
  MatcherPatternHash,
  MatcherParamsFormatted,
  MatcherQueryParams,
} from './matchers/matcher-pattern'
import type {
  ResolverLocationAsRelative,
  ResolverLocationAsPathAbsolute,
  ResolverLocationAsPathRelative,
  ResolverLocationAsNamed,
  RecordName,
  ResolverLocationResolved,
  EXPERIMENTAL_Resolver_Base,
} from './resolver-abstract'
import { NO_MATCH_LOCATION } from './resolver-abstract'
import type { MatcherPatternQuery } from './matchers/matcher-pattern-query'
import { warn } from '../../warning'
import { diagnostics } from '../../diagnostics'
import { assign } from '../../utils'
import { MatchMiss, miss } from './matchers/errors'

/**
 * Base interface for a resolver record that can be extended.
 */
export interface EXPERIMENTAL_ResolverRecord_Base {
  /**
   * Name of the matcher. Unique across all matchers. If missing, this record
   * cannot be matched. This is useful for grouping records.
   */
  name?: RecordName

  /**
   * {@link MatcherPattern} for the path section of the URI.
   */
  path?: MatcherPatternPath

  /**
   * {@link MatcherPattern} for the query section of the URI.
   */
  query?: MatcherPatternQuery[]

  /**
   * {@link MatcherPattern} for the hash section of the URI.
   */
  hash?: MatcherPatternHash

  /**
   * Parent record. The parent can be a group or a matchable record.
   * It will be included in the `matched` array of a resolved location.
   */
  parent?: EXPERIMENTAL_ResolverRecord_Base | null // the parent can be matchable or not

  /**
   * If this record is an alias of another record, this points to the original
   * record. Alias records are not added to the name map and resolve to the
   * original record's name.
   */
  aliasOf?: EXPERIMENTAL_ResolverRecord_Base | null
}

/**
 * A group can contain other useful properties like `meta` defined by the router.
 */
export interface EXPERIMENTAL_ResolverRecord_Group extends EXPERIMENTAL_ResolverRecord_Base {
  /**
   * A group route cannot be matched directly and cannot be named.
   */
  name?: undefined

  /**
   * A group route can **only** match the `query`.
   */
  path?: undefined

  // Query is the only kind of matcher that is non-exclusive
  // all matched records get their queries merged
  // query?: undefined

  /**
   * A group route can **only** match the `query`.
   */
  hash?: undefined
}

/**
 * A matchable record is a record that can be matched by a path, query or hash
 * and will resolve to a location.
 */
export interface EXPERIMENTAL_ResolverRecord_Matchable extends EXPERIMENTAL_ResolverRecord_Base {
  name: RecordName
  path: MatcherPatternPath
}

/**
 * A record that can be passed to the resolver. It can be extended via the
 * `ExtensionT` type param.
 */
export type EXPERIMENTAL_ResolverRecord<ExtensionT = {}> =
  | (EXPERIMENTAL_ResolverRecord_Matchable & ExtensionT)
  | (EXPERIMENTAL_ResolverRecord_Group & ExtensionT)

/**
 * @alias EXPERIMENTAL_Resolver_Base
 */
export interface EXPERIMENTAL_ResolverFixed<
  TRecord,
> extends EXPERIMENTAL_Resolver_Base<TRecord> {}

/**
 * Build the `matched` array of a record that includes all parent records from the root to the current one.
 */
export function buildMatched<T extends EXPERIMENTAL_ResolverRecord_Base>(
  record: T
): T[] {
  const matched: T[] = []
  let node: T | undefined = record
  while (node) {
    matched.unshift(node)
    node = node.parent as T
  }
  return matched
}

/**
 * Creates a fixed resolver that must have all records defined at creation
 * time.
 *
 * @template TRecord - extended type of the records
 * @param {TRecord[]} records - Ordered array of records that will be used to resolve routes
 * @returns a resolver that can be passed to the router
 */
export function createFixedResolver<
  TRecord extends EXPERIMENTAL_ResolverRecord_Matchable,
>(records: TRecord[]): EXPERIMENTAL_ResolverFixed<TRecord> {
  // allows fast access to a matcher by name
  // alias records are excluded so name lookups always return the original
  const recordMap = new Map<RecordName, TRecord>()
  for (const record of records) {
    if (!record.aliasOf) {
      recordMap.set(record.name, record)
    }
  }

  // NOTE: because of the overloads for `resolve`, we need to manually type the arguments
  type _resolveArgs =
    | [absoluteLocation: `/${string}`, currentLocation?: undefined]
    | [
        relativeLocation: string,
        currentLocation: ResolverLocationResolved<TRecord>,
      ]
    | [
        absoluteLocation: ResolverLocationAsPathAbsolute,
        // Same as above
        // currentLocation?: NEW_LocationResolved<TRecord> | undefined
        currentLocation?: undefined,
      ]
    | [
        relativeLocation: ResolverLocationAsPathRelative,
        currentLocation: ResolverLocationResolved<TRecord>,
      ]
    | [
        location: ResolverLocationAsNamed,
        currentLocation?: ResolverLocationResolved<TRecord>,
      ]
    | [
        relativeLocation: ResolverLocationAsRelative,
        currentLocation: ResolverLocationResolved<TRecord>,
      ]

  /**
   * Matches the url against the record. Returns `null` if any matcher misses
   * or throws (e.g. a param parser calling `miss()`).
   */
  function validateMatch(record: TRecord, url: LocationNormalized) {
    try {
      // match the path because the path matcher only needs to be matched here
      // match the hash because only the deepest child matters
      // End up by building up the matched array, (reversed so it goes from
      // root to child) and then match and merge all queries
      const pathParams = record.path.match(url.path)
      if (!pathParams) return null
      const hashParams = record.hash?.match(url.hash)
      if (hashParams === null) return null
      const matched = buildMatched(record)
      const queryParams: MatcherQueryParams = {}
      for (const matchedRecord of matched) {
        for (const query of matchedRecord.query || []) {
          const params = query.match(url.query)
          if (!params) return null
          assign(queryParams, params)
        }
      }

      // we found our match!
      return [
        matched,
        { ...pathParams, ...queryParams, ...hashParams },
      ] as const
    } catch (error) {
      // a MatchMiss is a regular miss, anything else is likely a bug
      if (__DEV__ && !(error instanceof MatchMiss)) {
        diagnostics.VUE_ROUTER_R0126({
          name: String(record.name),
          path: url.path,
          cause: error,
        })
      }
      return null
    }
  }

  function resolve(
    ...[to, currentLocation]: _resolveArgs
  ): ResolverLocationResolved<TRecord> {
    if (__DEV__ && typeof to === 'object') {
      warnNonArrayQueryValues(to.query)
    }

    // named location, e.g. { name: 'foo', params }
    // or relative location (second argument is current location)
    if (typeof to === 'object' && (to.name || to.path == null)) {
      // relative location by path or by name
      if (__DEV__ && to.name == null && currentLocation == null) {
        warn(
          `Cannot resolve relative location "${JSON.stringify(to)}"without a "name" or a current location. This will crash in production.`,
          to
        )
        // NOTE: normally there is no query, hash or path but this helps debug
        // what kind of object location was passed
        // @ts-expect-error: to is never
        const query = normalizeQuery(to.query)
        // @ts-expect-error: to is never
        const hash = encodeHash(to.hash ?? '')
        // @ts-expect-error: to is never
        const path = to.path ?? '/'
        return {
          // type is never
          ...(to as any),
          ...NO_MATCH_LOCATION,
          fullPath: stringifyURL(stringifyQuery, path, query, hash),
          path,
          query,
          hash,
        }
      }

      // either one of them must be defined and is caught by the dev only warn above
      const name = to.name ?? currentLocation!.name
      const record = recordMap.get(name)!

      if (__DEV__) {
        if (!record || !name) {
          throw new Error(`Record "${String(name)}" not found`)
        }

        if (typeof to === 'object' && to.hash && !to.hash.startsWith('#')) {
          warn(
            `A "hash" should always start with the character "#". Replace "${to.hash}" with "#${to.hash}".`
          )
        }
      }

      // unencoded params in a formatted form that the user came up with
      let params: MatcherParamsFormatted = {
        ...currentLocation?.params,
        ...to.params,
      }
      const path = record.path.build(params)
      // currentLocation.hash is already encoded, encodeHash is idempotent
      const hash = encodeHash(
        record.hash?.build(params) ?? to.hash ?? currentLocation?.hash ?? ''
      )
      let matched = buildMatched(record)
      // parser.set() can return non array values
      const query = normalizeQuery(
        assign(
          {
            ...currentLocation?.query,
            ...normalizeQuery(to.query),
          },
          ...matched.flatMap(record =>
            record.query?.map(query => query.build(params))
          )
        )
      )

      if (__DEV__) {
        const toQuery = normalizeQuery(to.query)
        for (const key in toQuery) {
          const value = query[key]
          // a param overrode the value passed in `to.query`
          if (
            value?.length !== toQuery[key]!.length ||
            toQuery[key]!.some((v, i) => v !== value[i])
          ) {
            diagnostics.VUE_ROUTER_R0123({ key })
          }
        }
      }

      const url: LocationNormalized = {
        // preserve other fields like `state` and `replace`
        ...to,
        fullPath: stringifyURL(
          stringifyQuery,
          path,
          query,
          hash
        ) as `/${string}`,
        path,
        hash,
        query,
      }

      // we avoid inconsistencies in params coming from query and hash
      const validated = validateMatch(record, url)
      if (!validated) {
        if (__DEV__) {
          diagnostics.VUE_ROUTER_R0125({ name: String(name) })
        }
        // Deliberate: a real error thrown by a matcher or parser is not
        // rethrown. Dev logs it (R0126). Prod stays small, and parsers are
        // the user's responsibility.
        miss()
      }
      ;[matched, params] = validated

      return {
        ...url,
        name,
        matched,
        params,
      }

      // string location, e.g. '/foo', '../bar', 'baz', '?page=1'
    } else {
      // parseURL handles relative paths
      let url: LocationNormalized
      if (typeof to === 'string') {
        url = parseURL(parseQuery, to, currentLocation?.path)
      } else {
        const query = normalizeQuery(to.query)
        const path = resolveRelativePath(to.path, currentLocation?.path || '/')
        const hash = encodeHash(to.hash || '')
        url = {
          // preserve other fields like `state` and `replace`
          ...to,
          fullPath: stringifyURL(stringifyQuery, path, query, hash),
          path,
          query,
          hash,
        }
      }

      let record: TRecord | undefined
      let validated: ReturnType<typeof validateMatch> | undefined

      for (record of records) {
        if ((validated = validateMatch(record, url))) break
      }

      // No match location
      if (!validated) {
        return {
          ...url,
          ...NO_MATCH_LOCATION,
          // already decoded
          // query: url.query,
          // hash: url.hash,
        }
      }

      return {
        ...url,
        // record exists if validated exists
        name: record!.name,
        params: validated[1],
        matched: validated[0],
      }
    }
  }

  return {
    resolve,
    getRoutes: () => records,
    getRoute: name => recordMap.get(name),
  }
}
