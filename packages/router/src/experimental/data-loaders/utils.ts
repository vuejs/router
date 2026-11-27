import type { LocationQuery } from '../../query'
import type { Router } from '../../router'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'
import type { DataLoaderEntryBase, UseDataLoader } from './createDataLoader'
import { IS_USE_DATA_LOADER_KEY } from './symbols'

/**
 * Check if a value is a `DataLoader`.
 *
 * @param loader - the object to check
 */
export function isDataLoader(loader: any): loader is UseDataLoader {
  return loader && loader[IS_USE_DATA_LOADER_KEY]
}

/**
 * Context of the data loader that is currently running. Nested loaders read it
 * to find their parent loader, the router, and the target route.
 *
 * @internal: data loaders authoring only.
 */
export type LoaderContext = readonly [
  /**
   * Entry of the parent loader.
   */
  entry: DataLoaderEntryBase,

  /**
   * Router instance that runs the navigation.
   */
  router: Router,

  /**
   * Target route of the navigation.
   */
  route: RouteLocationNormalizedLoaded,
]

/**
 * Fallback storage when `AsyncLocalStorage` is missing (browsers). Only one
 * router runs there, so a global is safe.
 *
 * @internal: data loaders authoring only. Use `getCurrentContext` instead.
 */
export let currentContext: LoaderContext | undefined | null

// a global is shared by concurrent SSR requests, so the context must follow
// the async chain. No static import to keep browser bundles unchanged
const AsyncStorage = (globalThis as any).process?.getBuiltinModule?.(
  'node:async_hooks'
)?.AsyncLocalStorage
const asyncStorage: {
  getStore(): LoaderContext | null | undefined
  enterWith(store: LoaderContext | null): void
} = AsyncStorage && new AsyncStorage()

/**
 * Get the context of the loader that is currently running. Returns an empty
 * array outside of a loader.
 *
 * @internal: data loaders authoring only.
 */
export function getCurrentContext(): LoaderContext | readonly [] {
  // an empty array allows destructuring without checking if it's undefined
  return (
    (asyncStorage ? asyncStorage.getStore() : currentContext) || ([] as const)
  )
}

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
  const value = context?.length ? context : null
  if (asyncStorage) asyncStorage.enterWith(value)
  else currentContext = value
}

/**
 * Restore the current context after a promise is resolved.
 * @param promise - promise to wrap
 */
export function withLoaderContext<P extends Promise<unknown>>(promise: P): P {
  const context = getCurrentContext()
  return promise.finally(() => setCurrentContext(context)) as P
}

/**
 * Object and promise of the object itself. Used when we can await some of the properties of an object to be loaded.
 * @internal
 */
export type _PromiseMerged<PromiseType, RawType = PromiseType> = RawType &
  Promise<PromiseType>

/**
 * Track the reads of a route and its properties
 * @internal
 * @param route - route to track
 */
export function trackRoute(route: RouteLocationNormalizedLoaded) {
  const [params, paramReads] = trackObjectReads(route.params)
  const [query, queryReads] = trackObjectReads(route.query)
  const hash: { v: string | null } = { v: null }
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
        return (reads[p] = Reflect.get(target, p, receiver))
      },
    }),
    reads,
  ] as const
}

/**
 * Returns `true` if `inner` is a subset of `outer`. Used to check if the
 * tracked properties of a route changed.
 *
 * @internal
 * @param inner - the smaller params
 * @param outer - the bigger params
 */
export function isSubsetOf(
  inner: Partial<LocationQuery>,
  outer: LocationQuery
): boolean {
  for (const key in inner) {
    const innerValue = inner[key]
    const outerValue = outer[key]
    if (
      Array.isArray(innerValue) && Array.isArray(outerValue)
        ? innerValue.length !== outerValue.length ||
          innerValue.some((value, i) => value !== outerValue[i])
        : innerValue !== outerValue
    )
      return false
  }

  return true
}
