import type { EffectScope, App } from 'vue'
import type { DataLoaderEntryBase, UseDataLoader } from './createDataLoader'
import type {
  APP_KEY,
  LOADER_ENTRIES_KEY,
  LOADER_SET_KEY,
  PENDING_LOCATION_KEY,
  ABORT_CONTROLLER_KEY,
  IS_SSR_KEY,
  DATA_LOADERS_EFFECT_SCOPE_KEY,
} from './symbols'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'
import type { INITIAL_DATA_KEY, SERVER_INITIAL_DATA_KEY } from './defineLoader'

/**
 * Map type for the entries used by data loaders.
 * @internal
 */
export type _DefineLoaderEntryMap<
  DataLoaderEntry extends DataLoaderEntryBase<unknown> =
    DataLoaderEntryBase<unknown>,
> = WeakMap<
  // Depending on the `defineLoader()` they might use a different thing as key
  // e.g. an function for basic defineLoader, a doc instance for VueFire
  object,
  DataLoaderEntry
>

// we want to import from this meta extensions to include the changes to route
export * from './symbols'

/**
 * The extensions added to the router instance for data loaders. These are used
 * internally by the router and should not be accessed directly by users.
 *
 * @internal
 */
export interface DataLoaderExtensions {
  /**
   * The entries used by data loaders. Put on the router for convenience.
   * @internal
   */
  [LOADER_ENTRIES_KEY]: _DefineLoaderEntryMap

  /**
   * Pending navigation that is waiting for data loaders to resolve.
   * @internal
   */
  [PENDING_LOCATION_KEY]: RouteLocationNormalizedLoaded | null

  /**
   * The app instance that is used by the router.
   * @internal
   */
  [APP_KEY]: App<unknown>

  /**
   * Whether the router is running in server-side rendering mode.
   * @internal
   */
  [IS_SSR_KEY]: boolean

  /**
   * The effect scope used to run data loaders.
   * @internal
   */
  [DATA_LOADERS_EFFECT_SCOPE_KEY]: EffectScope

  /**
   * Gives access to the initial state during rendering. Should be set to `false` once it's consumed.
   * Used by `defineLoader`
   *
   * @internal
   */
  [SERVER_INITIAL_DATA_KEY]?: Record<string, unknown> | false

  /**
   * Used by `defineLoader`
   *
   * @internal
   */
  [INITIAL_DATA_KEY]?: Record<string, unknown> | false
}

declare module '../../types' {
  export interface RouteMeta {
    /**
     * The data loaders for a route record. Add any data loader to this array to have it called when the route is
     * navigated to. Note this is only needed when **not** using lazy components (`() => import('./pages/Home.vue')`) or
     * when not explicitly exporting data loaders from page components.
     */
    loaders?: UseDataLoader[]

    /**
     * Set of loaders for the current route. This is built once during navigation and is used to merge the loaders from
     * the lazy import in components or the `loaders` array in the route record.
     * @internal
     */
    [LOADER_SET_KEY]?: Set<UseDataLoader>

    /**
     * The signal that is aborted when the navigation is canceled or an error occurs.
     * @internal
     */
    [ABORT_CONTROLLER_KEY]?: AbortController
  }
}
