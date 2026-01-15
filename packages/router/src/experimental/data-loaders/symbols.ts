/**
 * Retrieves the internal version of loaders.
 * @internal
 */
export const LOADER_SET_KEY = Symbol('loaders')

/**
 * Retrieves the internal version of loader entries.
 * @internal
 */
export const LOADER_ENTRIES_KEY = Symbol('loaderEntries')

/**
 * Added to the loaders returned by `defineLoader()` to identify them.
 * Allows to extract exported useData() from a component.
 * @internal
 */
export const IS_USE_DATA_LOADER_KEY = Symbol()

/**
 * Symbol used to save the pending location on the router.
 * @internal
 */
export const PENDING_LOCATION_KEY = Symbol()

/**
 * Symbol used to know there is no value staged for the loader and that commit should be skipped.
 * @internal
 */
export const STAGED_NO_VALUE = Symbol()

/**
 * Gives access to the current app and it's `runWithContext` method.
 * @internal
 */
export const APP_KEY = Symbol()

/**
 * Gives access to an AbortController that aborts when the navigation is canceled.
 * @internal
 */
export const ABORT_CONTROLLER_KEY = Symbol()

/**
 * Gives access to the navigation results when the navigation is aborted by the user within a data loader.
 * @internal
 */
export const NAVIGATION_RESULTS_KEY = Symbol()

/**
 * Symbol used to save the initial data on the router.
 * @internal
 */
export const IS_SSR_KEY = Symbol()

/**
 * Symbol used to get the effect scope used for data loaders.
 * @internal
 */
export const DATA_LOADERS_EFFECT_SCOPE_KEY = Symbol()
