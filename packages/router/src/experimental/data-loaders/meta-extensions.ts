import type { App } from 'vue'
import type {
  APP_KEY,
  PENDING_LOCATION_KEY,
  IS_SSR_KEY,
  INITIAL_DATA_KEY,
} from './symbols'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'

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
   * Initial data consumed by `defineBasicLoader()` on the first load.
   *
   * @internal
   */
  [INITIAL_DATA_KEY]?: Record<string, unknown> | false
}
