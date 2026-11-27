/**
 * Set of loaders collected for a navigation. Stored on `to.meta`.
 * @internal
 */
export const LOADER_SET_KEY = Symbol('loaders')

/**
 * Added to the composables returned by `defineLoader()` to identify them.
 * Allows to extract exported `useData()` from a component.
 * @internal
 */
export const IS_USE_DATA_LOADER_KEY = Symbol()

/**
 * Location of the pending navigation. Stored on the router.
 * @internal
 */
export const PENDING_LOCATION_KEY = Symbol()

/**
 * Marks the absence of a staged value so `commit()` keeps the current data.
 * @internal
 */
export const STAGED_NO_VALUE = Symbol()

/**
 * App that installed the plugin, used for `app.runWithContext()`. Stored on the router.
 * @internal
 */
export const APP_KEY = Symbol()

/**
 * AbortController that aborts when the navigation is canceled. Stored on `to.meta`.
 * @internal
 */
export const ABORT_CONTROLLER_KEY = Symbol()

/**
 * Whether the router runs on the server. Stored on the router.
 * @internal
 */
export const IS_SSR_KEY = Symbol()

/**
 * Initial data generated on the server and consumed on the client by
 * `defineBasicLoader()`. Stored on the router.
 * @internal
 */
export const INITIAL_DATA_KEY = Symbol()
