import { LocationQuery } from '../../query'
import { Router } from '../../router'
import { RouteLocationNormalizedLoaded } from '../../typed-routes'
import type { DataLoaderEntryBase, UseDataLoader } from './createDataLoader'
import { IS_USE_DATA_LOADER_KEY } from './meta-extensions'

/**
 * Check if a value is a `DataLoader`.
 *
 * @param loader - the object to check
 */
export function isDataLoader(loader: any): loader is UseDataLoader {
  return loader && loader[IS_USE_DATA_LOADER_KEY]
}

/**
 * @internal: data loaders authoring only. Use `getCurrentContext` instead.
 */
export let currentContext:
  | readonly [
      entry: DataLoaderEntryBase,
      router: Router,
      route: RouteLocationNormalizedLoaded,
    ]
  | undefined
  | null

export function getCurrentContext() {
  // an empty array allows destructuring without checking if it's undefined
  return currentContext || ([] as const)
}

// TODO: rename parentContext
/**
 * Sets the current context for data loaders. This allows for nested loaders to be aware of their parent context.
 * INTERNAL ONLY.
 *
 * @param context - the context to set
 * @internal
 */
export function setCurrentContext(
  context?: typeof currentContext | readonly []
) {
  currentContext = context ? (context.length ? context : null) : null
}

/**
 * Restore the current context after a promise is resolved.
 * @param promise - promise to wrap
 */
export function withLoaderContext<P extends Promise<unknown>>(promise: P): P {
  const context = currentContext
  return promise.finally(() => (currentContext = context)) as P
}

/**
 * Object and promise of the object itself. Used when we can await some of the properties of an object to be loaded.
 * @internal
 */
export type _PromiseMerged<PromiseType, RawType = PromiseType> = RawType &
  Promise<PromiseType>

export const assign = Object.assign

/**
 * Track the reads of a route and its properties
 * @internal
 * @param route - route to track
 */
export function trackRoute(route: RouteLocationNormalizedLoaded) {
  const [params, paramReads] = trackObjectReads(route.params)
  const [query, queryReads] = trackObjectReads(route.query)
  let hash: { v: string | null } = { v: null }
  return [
    {
      ...route,
      // track the hash
      get hash() {
        return (hash.v = route.hash)
      },
      params,
      query,
    },
    paramReads,
    queryReads,
    hash,
  ] as const
}

/**
 *  Track the reads of an object (that doesn't change) and add the read properties to an object
 * @internal
 * @param obj - object to track
 */
function trackObjectReads<T extends Record<string, unknown>>(obj: T) {
  const reads: Partial<T> = {}
  return [
    new Proxy(obj, {
      get(target, p: Extract<keyof T, string>, receiver) {
        const value = Reflect.get(target, p, receiver)
        reads[p] = value
        return value
      },
    }),
    reads,
  ] as const
}

/**
 * Returns `true` if `inner` is a subset of `outer`. Used to check if a tr
 *
 * @internal
 * @param outer - the bigger params
 * @param inner - the smaller params
 */
export function isSubsetOf(
  inner: Partial<LocationQuery>,
  outer: LocationQuery
): boolean {
  for (const key in inner) {
    const innerValue = inner[key]
    const outerValue = outer[key]
    if (typeof innerValue === 'string') {
      if (innerValue !== outerValue) return false
    } else if (!innerValue || !outerValue) {
      // if one of them is undefined, we need to check if the other is undefined too
      if (innerValue !== outerValue) return false
    } else {
      if (
        !Array.isArray(outerValue) ||
        outerValue.length !== innerValue.length ||
        innerValue.some((value, i) => value !== outerValue[i])
      )
        return false
    }
  }

  return true
}
