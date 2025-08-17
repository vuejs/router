import { normalizeQuery, parseQuery, stringifyQuery } from '../../query'
import {
  LocationNormalized,
  NEW_stringifyURL,
  parseURL,
  resolveRelativePath,
} from '../../location'
import { MatcherParamsFormatted } from './matchers/matcher-pattern'
import { ResolverLocationAsRelative } from './resolver-abstract'
import { ResolverLocationAsPathAbsolute } from './resolver-abstract'
import { ResolverLocationAsPathRelative } from './resolver-abstract'
import { ResolverLocationAsNamed } from './resolver-abstract'
import {
  RecordName,
  ResolverLocationResolved,
  EXPERIMENTAL_Resolver_Base,
  NO_MATCH_LOCATION,
} from './resolver-abstract'
import { MatcherQueryParams } from './matchers/matcher-pattern'
import type {
  MatcherPatternPath,
  MatcherPatternQuery,
  MatcherPatternHash,
} from './matchers/matcher-pattern'
import { warn } from '../../warning'

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

  parent?: EXPERIMENTAL_ResolverRecord | null // the parent can be matchable or not

  // TODO: implement aliases
  // aliasOf?: this
}

/**
 * A group can contain other useful properties like `meta` defined by the router.
 */
export interface EXPERIMENTAL_ResolverRecord_Group
  extends EXPERIMENTAL_ResolverRecord_Base {
  name?: undefined
  path?: undefined
  // Query is the only kind of matcher that is non-exclusive
  // all matched records get their queries merged
  // query?: undefined
  hash?: undefined
}

/**
 * A matchable record is a record that can be matched by a path, query or hash and will resolve to a location.
 */
export interface EXPERIMENTAL_ResolverRecord_Matchable
  extends EXPERIMENTAL_ResolverRecord_Base {
  name: RecordName
  path: MatcherPatternPath
}

export type EXPERIMENTAL_ResolverRecord<ExtensionT = {}> =
  | (EXPERIMENTAL_ResolverRecord_Matchable & ExtensionT)
  | (EXPERIMENTAL_ResolverRecord_Group & ExtensionT)

export type EXPERIMENTAL_ResolverFixedRecord<ExtensionT = {}> =
  EXPERIMENTAL_ResolverRecord<ExtensionT>

export interface EXPERIMENTAL_ResolverFixed<TRecord>
  extends EXPERIMENTAL_Resolver_Base<TRecord> {}

/**
 * Build the `matched` array of a record that includes all parent records from the root to the current one.
 */
export function buildMatched<T extends EXPERIMENTAL_ResolverRecord>(
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
  const recordMap = new Map<RecordName, TRecord>()
  for (const record of records) {
    recordMap.set(record.name, record)
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
        // Same as above
        // currentLocation?: NEW_LocationResolved<TRecord> | undefined
        currentLocation?: undefined,
      ]
    | [
        relativeLocation: ResolverLocationAsRelative,
        currentLocation: ResolverLocationResolved<TRecord>,
      ]

  function resolve(
    ...[to, currentLocation]: _resolveArgs
  ): ResolverLocationResolved<TRecord> {
    // named location, e.g. { name: 'foo', params }
    // or relative location (second argument is current location)
    if (typeof to === 'object' && (to.name || to.path == null)) {
      // relative location by path or by name
      if (__DEV__ && to.name == null && currentLocation == null) {
        warn(
          `Cannot resolve relative location "${JSON.stringify(to)}"without a current location. This will throw in production.`,
          to
        )
        // NOTE: normally there is no query, hash or path but this helps debug
        // what kind of object location was passed
        // @ts-expect-error: to is never
        const query = normalizeQuery(to.query)
        // @ts-expect-error: to is never
        const hash = to.hash ?? ''
        // @ts-expect-error: to is never
        const path = to.path ?? '/'
        return {
          ...NO_MATCH_LOCATION,
          fullPath: NEW_stringifyURL(stringifyQuery, path, query, hash),
          path,
          query,
          hash,
        }
      }

      // either one of them must be defined and is catched by the dev only warn above
      const name = to.name ?? currentLocation!.name
      const record = recordMap.get(name)!

      if (__DEV__) {
        if (!record || !name) {
          throw new Error(`Record "${String(name)}" not found`)
        }

        if (typeof to === 'object' && to.hash && !to.hash.startsWith('#')) {
          warn(
            `A \`hash\` should always start with the character "#". Replace "${to.hash}" with "#${to.hash}".`
          )
        }
      }

      // unencoded params in a formatted form that the user came up with
      const params: MatcherParamsFormatted = {
        ...currentLocation?.params,
        ...to.params,
      }
      const path = record.path.build(params)
      const hash = record.hash?.build(params) ?? ''
      const matched = buildMatched(record)
      const query = Object.assign(
        {
          ...currentLocation?.query,
          ...normalizeQuery(to.query),
        },
        ...matched.flatMap(record =>
          record.query?.map(query => query.build(params))
        )
      )

      return {
        name,
        fullPath: NEW_stringifyURL(stringifyQuery, path, query, hash),
        path,
        query,
        hash,
        params,
        matched,
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
        url = {
          fullPath: NEW_stringifyURL(stringifyQuery, path, query, to.hash),
          path,
          query,
          hash: to.hash || '',
        }
      }

      let record: TRecord | undefined
      let matched: ResolverLocationResolved<TRecord>['matched'] | undefined
      let parsedParams: MatcherParamsFormatted | null | undefined

      for (record of records) {
        // match the path because the path matcher only needs to be matched here
        // match the hash because only the deepest child matters
        // End up by building up the matched array, (reversed so it goes from
        // root to child) and then match and merge all queries
        try {
          const pathParams = record.path.match(url.path)
          const hashParams = record.hash?.match(url.hash)
          matched = buildMatched(record)
          const queryParams: MatcherQueryParams = Object.assign(
            {},
            ...matched.flatMap(record =>
              record.query?.map(query => query.match(url.query))
            )
          )
          // TODO: test performance
          // for (const record of matched) {
          //   Object.assign(queryParams, record.query?.match(url.query))
          // }

          parsedParams = { ...pathParams, ...queryParams, ...hashParams }
          // we found our match!
          break
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
          // query: url.query,
          // hash: url.hash,
        }
      }

      return {
        ...url,
        // record exists if matched exists
        name: record!.name,
        params: parsedParams,
        matched,
      }
      // TODO: handle object location { path, query, hash }
    }
  }

  return {
    resolve,
    getRecords: () => records,
    getRecord: name => recordMap.get(name),
  }
}
