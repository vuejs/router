import {
  createRouterError,
  ErrorTypes,
  isNavigationFailure,
  NavigationRedirectError,
  type _ErrorListener,
  type NavigationFailure,
} from '../errors'
import {
  nextTick,
  shallowReactive,
  ShallowRef,
  shallowRef,
  unref,
  warn,
  type App,
} from 'vue'
import { RouterLink } from '../RouterLink'
import {
  NavigationType,
  type HistoryState,
  type RouterHistory,
} from '../history/common'
import type { PathParserOptions } from '../matcher'
import {
  parseQuery as originalParseQuery,
  stringifyQuery as originalStringifyQuery,
} from '../query'
import type { Router } from '../router'
import {
  _ScrollPositionNormalized,
  computeScrollPosition,
  getSavedScrollPosition,
  getScrollKey,
  saveScrollPosition,
  scrollToPosition,
  type RouterScrollBehavior,
} from '../scrollBehavior'
import type {
  _RouteRecordProps,
  NavigationGuard,
  NavigationGuardWithThis,
  NavigationHookAfter,
  RouteLocation,
  RouteLocationAsPath,
  RouteLocationAsRelative,
  RouteLocationAsRelativeTyped,
  RouteLocationAsString,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  RouteLocationResolved,
  RouteMap,
  RouteRecordNameGeneric,
} from '../typed-routes'
import {
  Lazy,
  RawRouteComponent,
  RouteLocationOptions,
  RouteMeta,
} from '../types'
import { useCallbacks } from '../utils/callbacks'
import {
  isSameRouteLocation,
  parseURL,
  START_LOCATION_NORMALIZED,
} from '../location'
import { assign, isArray, isBrowser, noop } from '../utils'
import {
  extractChangingRecords,
  extractComponentsGuards,
  guardToPromiseFn,
} from '../navigationGuards'
import { addDevtools } from '../devtools'
import {
  routeLocationKey,
  routerKey,
  routerViewLocationKey,
} from '../injectionSymbols'
import {
  EXPERIMENTAL_ResolverRecord_Base,
  EXPERIMENTAL_ResolverRecord_Group,
  EXPERIMENTAL_ResolverRecord_Matchable,
  EXPERIMENTAL_ResolverStatic,
} from './route-resolver/resolver-static'
import {
  ResolverLocationAsNamed,
  ResolverLocationAsPathRelative,
  ResolverLocationAsRelative,
  ResolverLocationResolved,
  RecordName,
} from './route-resolver/resolver-abstract'

/**
 * resolve, reject arguments of Promise constructor
 * @internal
 */
export type _OnReadyCallback = [() => void, (reason?: any) => void]

// NOTE: we could override each type with the new matched array but this would
// interface RouteLocationResolved<Name extends keyof RouteMap = keyof RouteMap>
//   extends Omit<_RouteLocationResolved<Name>, 'matched'> {
//   matched: EXPERIMENTAL_RouteRecordNormalized[]
// }

/**
 * Options to initialize a {@link Router} instance.
 */
export interface EXPERIMENTAL_RouterOptions_Base extends PathParserOptions {
  /**
   * History implementation used by the router. Most web applications should use
   * `createWebHistory` but it requires the server to be properly configured.
   * You can also use a _hash_ based history with `createWebHashHistory` that
   * does not require any configuration on the server but isn't handled at all
   * by search engines and does poorly on SEO.
   *
   * @example
   * ```js
   * createRouter({
   *   history: createWebHistory(),
   *   // other options...
   * })
   * ```
   */
  history: RouterHistory

  /**
   * Function to control scrolling when navigating between pages. Can return a
   * Promise to delay scrolling.
   *
   * @see {@link RouterScrollBehavior}.
   *
   * @example
   * ```js
   * function scrollBehavior(to, from, savedPosition) {
   *   // `to` and `from` are both route locations
   *   // `savedPosition` can be null if there isn't one
   * }
   * ```
   */
  scrollBehavior?: RouterScrollBehavior

  /**
   * Custom implementation to parse a query. See its counterpart,
   * {@link EXPERIMENTAL_RouterOptions_Base.stringifyQuery}.
   *
   * @example
   * Let's say you want to use the [qs package](https://github.com/ljharb/qs)
   * to parse queries, you can provide both `parseQuery` and `stringifyQuery`:
   * ```js
   * import qs from 'qs'
   *
   * createRouter({
   *   // other options...
   *   parseQuery: qs.parse,
   *   stringifyQuery: qs.stringify,
   * })
   * ```
   */
  parseQuery?: typeof originalParseQuery

  /**
   * Custom implementation to stringify a query object. Should not prepend a leading `?`.
   * {@link parseQuery} counterpart to handle query parsing.
   */

  stringifyQuery?: typeof originalStringifyQuery

  /**
   * Default class applied to active {@link RouterLink}. If none is provided,
   * `router-link-active` will be applied.
   */
  linkActiveClass?: string

  /**
   * Default class applied to exact active {@link RouterLink}. If none is provided,
   * `router-link-exact-active` will be applied.
   */
  linkExactActiveClass?: string

  /**
   * Default class applied to non-active {@link RouterLink}. If none is provided,
   * `router-link-inactive` will be applied.
   */
  // linkInactiveClass?: string
}

// TODO: non matchable and parent
/**
 * Internal type for common properties among all kind of {@link RouteRecordRaw}.
 */
export interface EXPERIMENTAL_RouteRecord_Base
  extends EXPERIMENTAL_ResolverRecord_Base {
  // TODO:
  /**
   * Where to redirect if the route is directly matched. The redirection happens
   * before any navigation guard and triggers a new navigation with the new
   * target location.
   */
  // redirect?: RouteRecordRedirectOption;

  // TODO:
  /**
   * Aliases for the record. Allows defining extra paths that will behave like a
   * copy of the record. Allows having paths shorthands like `/users/:id` and
   * `/u/:id`. All `alias` and `path` values must share the same params.
   */
  // alias?: string | string[]

  // TODO:
  /**
   * Before Enter guard specific to this record. Note `beforeEnter` has no
   * effect if the record has a `redirect` property.
   */
  // beforeEnter?:
  //   | NavigationGuardWithThis<undefined>
  //   | NavigationGuardWithThis<undefined>[]

  /**
   * Arbitrary data attached to the record.
   */
  meta?: RouteMeta

  // TODO:
  /**
   * Array of nested routes.
   */
  // children?: RouteRecordRaw[]

  /**
   * Components to display when the URL matches this route. Allow using named views.
   */
  components?: Record<string, RawRouteComponent>

  /**
   * Parent of this component if any
   */
  parent?: EXPERIMENTAL_RouteRecordRaw

  // TODO:
  /**
   * Allow passing down params as props to the component rendered by `router-view`.
   */
  // props?: _RouteRecordProps | Record<string, _RouteRecordProps>
}

export interface EXPERIMENTAL_RouteRecord_Matchable
  // preserve the values from the type EXPERIMENTAL_ResolverRecord_Matchable
  extends Omit<EXPERIMENTAL_RouteRecord_Base, 'name' | 'path' | 'parent'>,
    EXPERIMENTAL_ResolverRecord_Matchable {
  components: Record<string, RawRouteComponent>

  parent?: EXPERIMENTAL_RouteRecordNormalized | null

  redirect?: never
}

export interface EXPERIMENTAL_RouteRecord_Group
  extends Omit<
      EXPERIMENTAL_RouteRecord_Base,
      // preserve the values from the type EXPERIMENTAL_ResolverRecord_Group
      'name' | 'path' | 'query' | 'hash' | 'parent'
    >,
    EXPERIMENTAL_ResolverRecord_Group {
  components?: Record<string, RawRouteComponent>

  parent?: EXPERIMENTAL_RouteRecordNormalized | null

  // TODO:
  // redirect?: something
}

export type EXPERIMENTAL_RouteRecordRaw =
  | EXPERIMENTAL_RouteRecord_Matchable
  | EXPERIMENTAL_RouteRecord_Group
// | RouteRecordSingleViewWithChildren
// | RouteRecordMultipleViews
// | RouteRecordMultipleViewsWithChildren
// | RouteRecordRedirect

export interface EXPERIMENTAL_RouteRecordNoramlized_Base {
  /**
   * Contains the original modules for lazy loaded components.
   *
   * @internal
   */
  mods: Record<string, unknown>

  props: Record<string, _RouteRecordProps>

  /**
   * Registered leave guards
   *
   * @internal
   */
  leaveGuards: Set<NavigationGuard>

  /**
   * Registered update guards
   *
   * @internal
   */
  updateGuards: Set<NavigationGuard>

  // FIXME: remove the need for these
  instances: Record<string, unknown>
}

export interface EXPERIMENTAL_RouteRecordNormalized_Group
  extends EXPERIMENTAL_RouteRecordNoramlized_Base,
    EXPERIMENTAL_RouteRecord_Group {
  meta: RouteMeta
  parent: EXPERIMENTAL_RouteRecordNormalized | null
}

// TODO: is it worth to have 2 types for the undefined values?
export interface EXPERIMENTAL_RouteRecordNormalized_Matchable
  extends EXPERIMENTAL_RouteRecordNoramlized_Base,
    EXPERIMENTAL_RouteRecord_Matchable {
  meta: RouteMeta

  parent: EXPERIMENTAL_RouteRecordNormalized | null

  // TODO:
  // redirect?: unknown

  // TODO:
  // props: Record<string, _RouteRecordProps>

  components: Record<string, RawRouteComponent>
}

export type EXPERIMENTAL_RouteRecordNormalized =
  | EXPERIMENTAL_RouteRecordNormalized_Matchable
  | EXPERIMENTAL_RouteRecordNormalized_Group

export function normalizeRouteRecord(
  record: EXPERIMENTAL_RouteRecord_Group
): EXPERIMENTAL_RouteRecordNormalized_Group
export function normalizeRouteRecord(
  record: EXPERIMENTAL_RouteRecord_Matchable
): EXPERIMENTAL_RouteRecordNormalized_Matchable
export function normalizeRouteRecord(
  record: EXPERIMENTAL_RouteRecord_Matchable | EXPERIMENTAL_RouteRecord_Group
):
  | EXPERIMENTAL_RouteRecordNormalized_Matchable
  | EXPERIMENTAL_RouteRecordNormalized_Group {
  // we can't define mods if we want to call defineProperty later
  const normalizedRecord:
    | Omit<EXPERIMENTAL_RouteRecordNormalized_Matchable, 'mods'>
    | Omit<EXPERIMENTAL_RouteRecordNormalized_Group, 'mods'> = {
    meta: {},
    // must be defined as non enumerable because it contains modules
    // mods: {},
    props: {},
    parent: null,
    ...record,
    // FIXME: to be removed
    instances: {},
    leaveGuards: new Set(),
    updateGuards: new Set(),
  }
  // mods contain modules and shouldn't be copied,
  // logged or anything. It's just used for internal
  // advanced use cases like data loaders
  Object.defineProperty(normalizedRecord, 'mods', {
    value: {},
  })

  return normalizedRecord as
    | EXPERIMENTAL_RouteRecordNormalized_Matchable
    | EXPERIMENTAL_RouteRecordNormalized_Group
}

// TODO: probably need some generic types
// <TResolver extends NEW_RouterResolver_Base>,
/**
 * Options to initialize an experimental {@link EXPERIMENTAL_Router} instance.
 * @experimental
 */
export interface EXPERIMENTAL_RouterOptions
  extends EXPERIMENTAL_RouterOptions_Base {
  /**
   * Matcher to use to resolve routes.
   *
   * @experimental
   */
  resolver: EXPERIMENTAL_ResolverStatic<EXPERIMENTAL_RouteRecordNormalized_Matchable>
}

/**
 * Router base instance.
 *
 * @experimental This version is not stable, it's meant to replace {@link Router} in the future.
 */
export interface EXPERIMENTAL_Router_Base<TRecord> {
  // NOTE: for dynamic routing we need this
  // <TRouteRecordRaw, TRouteRecord>
  /**
   * Current {@link RouteLocationNormalized}
   */
  readonly currentRoute: ShallowRef<RouteLocationNormalizedLoaded>

  /**
   * Allows turning off the listening of history events. This is a low level api for micro-frontend.
   */
  listening: boolean

  /**
   * Checks if a route with a given name exists
   *
   * @param name - Name of the route to check
   */
  hasRoute(name: NonNullable<RouteRecordNameGeneric>): boolean

  /**
   * Get a full list of all the {@link RouteRecord | route records}.
   */
  getRoutes(): TRecord[]

  /**
   * Returns the {@link RouteLocation | normalized version} of a
   * {@link RouteLocationRaw | route location}. Also includes an `href` property
   * that includes any existing `base`. By default, the `currentLocation` used is
   * `router.currentRoute` and should only be overridden in advanced use cases.
   *
   * @param to - Raw route location to resolve
   * @param currentLocation - Optional current location to resolve against
   */
  resolve<Name extends keyof RouteMap = keyof RouteMap>(
    to: RouteLocationAsRelativeTyped<RouteMap, Name>,
    // NOTE: This version doesn't work probably because it infers the type too early
    // | RouteLocationAsRelative<Name>
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocationResolved<Name>
  resolve(
    // not having the overload produces errors in RouterLink calls to router.resolve()
    to: RouteLocationAsString | RouteLocationAsRelative | RouteLocationAsPath,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocationResolved

  /**
   * Programmatically navigate to a new URL by pushing an entry in the history
   * stack.
   *
   * @param to - Route location to navigate to
   */
  push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>

  /**
   * Programmatically navigate to a new URL by replacing the current entry in
   * the history stack.
   *
   * @param to - Route location to navigate to
   */
  replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>

  /**
   * Go back in history if possible by calling `history.back()`. Equivalent to
   * `router.go(-1)`.
   */
  back(): void

  /**
   * Go forward in history if possible by calling `history.forward()`.
   * Equivalent to `router.go(1)`.
   */
  forward(): void

  /**
   * Allows you to move forward or backward through the history. Calls
   * `history.go()`.
   *
   * @param delta - The position in the history to which you want to move,
   * relative to the current page
   */
  go(delta: number): void

  /**
   * Add a navigation guard that executes before any navigation. Returns a
   * function that removes the registered guard.
   *
   * @param guard - navigation guard to add
   */
  beforeEach(guard: NavigationGuardWithThis<undefined>): () => void

  /**
   * Add a navigation guard that executes before navigation is about to be
   * resolved. At this state all component have been fetched and other
   * navigation guards have been successful. Returns a function that removes the
   * registered guard.
   *
   * @param guard - navigation guard to add
   * @returns a function that removes the registered guard
   *
   * @example
   * ```js
   * router.beforeResolve(to => {
   *   if (to.meta.requiresAuth && !isAuthenticated) return false
   * })
   * ```
   *
   */
  beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void

  /**
   * Add a navigation hook that is executed after every navigation. Returns a
   * function that removes the registered hook.
   *
   * @param guard - navigation hook to add
   * @returns a function that removes the registered hook
   *
   * @example
   * ```js
   * router.afterEach((to, from, failure) => {
   *   if (isNavigationFailure(failure)) {
   *     console.log('failed navigation', failure)
   *   }
   * })
   * ```
   */
  afterEach(guard: NavigationHookAfter): () => void

  /**
   * Adds an error handler that is called every time a non caught error happens
   * during navigation. This includes errors thrown synchronously and
   * asynchronously, errors returned or passed to `next` in any navigation
   * guard, and errors occurred when trying to resolve an async component that
   * is required to render a route.
   *
   * @param handler - error handler to register
   */
  onError(handler: _ErrorListener): () => void

  /**
   * Returns a Promise that resolves when the router has completed the initial
   * navigation, which means it has resolved all async enter hooks and async
   * components that are associated with the initial route. If the initial
   * navigation already happened, the promise resolves immediately.
   *
   * This is useful in server-side rendering to ensure consistent output on both
   * the server and the client. Note that on server side, you need to manually
   * push the initial location while on client side, the router automatically
   * picks it up from the URL.
   */
  isReady(): Promise<void>

  /**
   * Called automatically by `app.use(router)`. Should not be called manually by
   * the user. This will trigger the initial navigation when on client side.
   *
   * @internal
   * @param app - Application that uses the router
   */
  install(app: App): void
}

export interface EXPERIMENTAL_Router
  // TODO: dynamic routing
  //   <
  //   TRouteRecordRaw, // extends NEW_MatcherRecordRaw,
  //   TRouteRecord extends NEW_MatcherRecord,
  // >
  extends EXPERIMENTAL_Router_Base<EXPERIMENTAL_RouteRecordNormalized_Matchable> {
  /**
   * Original options object passed to create the Router
   */
  readonly options: EXPERIMENTAL_RouterOptions
}

// export interface EXPERIMENTAL_RouteRecordRaw extends NEW_MatcherRecordRaw {
//   /**
//    * Arbitrary data attached to the record.
//    */
//   meta?: RouteMeta
//
//   components?: Record<string, unknown>
//   component?: unknown
//
//   redirect?: unknown
//   // TODO: Not needed
//   score: Array<number[]>
// }
//
//
// function normalizeRouteRecord(
//   record: EXPERIMENTAL_RouteRecordRaw
// ): EXPERIMENTAL_RouteRecordNormalized {
//   // FIXME: implementation
//   return {
//     name: __DEV__ ? Symbol('anonymous route record') : Symbol(),
//     meta: {},
//     ...record,
//     children: (record.children || []).map(normalizeRouteRecord),
//   }
// }

export function experimental_createRouter(
  options: EXPERIMENTAL_RouterOptions
): EXPERIMENTAL_Router {
  const {
    resolver,
    parseQuery = originalParseQuery,
    stringifyQuery = originalStringifyQuery,
    history: routerHistory,
  } = options

  // FIXME: can be removed, it was for migration purposes
  if (__DEV__ && !routerHistory)
    throw new Error(
      'Provide the "history" option when calling "createRouter()":' +
        ' https://router.vuejs.org/api/interfaces/RouterOptions.html#history'
    )

  const beforeGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
  const beforeResolveGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
  const afterGuards = useCallbacks<NavigationHookAfter>()
  const currentRoute = shallowRef<RouteLocationNormalizedLoaded>(
    START_LOCATION_NORMALIZED
  )
  let pendingLocation: RouteLocation = START_LOCATION_NORMALIZED

  // leave the scrollRestoration if no scrollBehavior is provided
  if (isBrowser && options.scrollBehavior) {
    history.scrollRestoration = 'manual'
  }

  function getRoutes() {
    return resolver.getRecords()
  }

  function hasRoute(name: NonNullable<RouteRecordNameGeneric>): boolean {
    return !!resolver.getRecord(name)
  }

  function locationAsObject(
    to: RouteLocationRaw | RouteLocationNormalized,
    currentLocation: string = currentRoute.value.path
  ): Exclude<RouteLocationRaw, string> | RouteLocationNormalized {
    return typeof to === 'string'
      ? parseURL(parseQuery, to, currentLocation)
      : to
  }

  // NOTE: to support multiple overloads
  type TRecord = EXPERIMENTAL_RouteRecordNormalized
  type _resolveArgs =
    // Handle string locations
    | [relativeLocation: string, currentLocation?: RouteLocationNormalizedLoaded]
    // Handle relative path objects
    | [relativeLocation: ResolverLocationAsPathRelative, currentLocation: RouteLocationNormalizedLoaded]
    // Handle named locations  
    | [location: ResolverLocationAsNamed, currentLocation?: undefined]
    // Handle relative location objects
    | [relativeLocation: ResolverLocationAsRelative, currentLocation: RouteLocationNormalizedLoaded]
    // Handle already resolved locations
    | [resolvedLocation: RouteLocationResolved, currentLocation?: undefined]
    // Handle generic location objects (broader compatibility)
    | [location: RouteLocationRaw, currentLocation?: RouteLocationNormalizedLoaded]

  function resolve(
    ...[to, currentLocation]: _resolveArgs
  ): RouteLocationResolved {
    // we create a copy to modify it later if needed
    // TODO: in the experimental version, allow configuring this
    const resolverCurrentLocation = currentLocation ? 
      assign({}, currentLocation) : currentLocation

    // Convert currentLocation to resolver-compatible format
    const convertedCurrentLocation = resolverCurrentLocation ? {
      ...resolverCurrentLocation,
      name: resolverCurrentLocation.name as RecordName,
      matched: resolverCurrentLocation.matched as unknown as TRecord[]
    } as ResolverLocationResolved<TRecord> : undefined

    // Call resolver.resolve - TypeScript inference should handle overloads
    const matchedRoute = resolver.resolve(
      to as any, // Type assertion needed due to overload complexity
      convertedCurrentLocation as any
    )
    
    const href = routerHistory.createHref(matchedRoute.fullPath)

    if (__DEV__) {
      if (href.startsWith('//')) {
        warn(
          `Location ${JSON.stringify(
            to
          )} resolved to "${href}". A resolved location cannot start with multiple slashes.`
        )
      }
      if (!matchedRoute.matched.length) {
        warn(`No match found for location with path "${to}"`)
      }
    }

    // matchedRoute is always a new object - convert to standard RouteLocationResolved
    const result: RouteLocationResolved = {
      name: matchedRoute.name as any,
      path: matchedRoute.path,
      fullPath: matchedRoute.fullPath,
      query: matchedRoute.query,
      hash: matchedRoute.hash,
      params: matchedRoute.params as any, // Type bridge for params
      matched: matchedRoute.matched as any, // Type bridge for matched array
      redirectedFrom: undefined,
      href,
      meta: mergeMetaFields(matchedRoute.matched),
    }

    return result
  }

  function checkCanceledNavigation(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): NavigationFailure | void {
    if (pendingLocation !== to) {
      return createRouterError<NavigationFailure>(
        ErrorTypes.NAVIGATION_CANCELLED,
        {
          from,
          to,
        }
      )
    }
  }

  const push = (...args: _resolveArgs) => pushWithRedirect(resolve(...args))

  const replace = (...args: _resolveArgs) =>
    pushWithRedirect(resolve(...args), true)

  function handleRedirectRecord(to: RouteLocation): RouteLocationRaw | void {
    const lastMatched = to.matched[to.matched.length - 1]
    if (lastMatched && lastMatched.redirect) {
      const { redirect } = lastMatched
      let newTargetLocation =
        typeof redirect === 'function' ? redirect(to) : redirect

      if (typeof newTargetLocation === 'string') {
        newTargetLocation =
          newTargetLocation.includes('?') || newTargetLocation.includes('#')
            ? (newTargetLocation = locationAsObject(newTargetLocation))
            : // force empty params
              { path: newTargetLocation }
        // Force empty params when a string is passed to let the router parse them again
        if ('params' in newTargetLocation || typeof newTargetLocation === 'object') {
          (newTargetLocation as any).params = {}
        }
      }

      if (
        __DEV__ &&
        newTargetLocation.path == null &&
        !('name' in newTargetLocation)
      ) {
        warn(
          `Invalid redirect found:\n${JSON.stringify(
            newTargetLocation,
            null,
            2
          )}\n when navigating to "${
            to.fullPath
          }". A redirect must contain a name or path. This will break in production.`
        )
        throw new Error('Invalid redirect')
      }

      return assign(
        {
          query: to.query,
          hash: to.hash,
          // avoid transferring params if the redirect has a path
          params: newTargetLocation.path != null ? {} : to.params,
        },
        newTargetLocation
      )
    }
  }

  function pushWithRedirect(
    to: RouteLocationResolved,
    replace?: boolean,
    redirectedFrom?: RouteLocation
  ): Promise<NavigationFailure | void | undefined> {
    replace = to.replace ?? replace
    pendingLocation = to
    const from = currentRoute.value
    const data: HistoryState | undefined = (to as RouteLocationOptions).state
    const force: boolean | undefined = (to as RouteLocationOptions).force

    const shouldRedirect = handleRedirectRecord(to)

    if (shouldRedirect) {
      const resolvedRedirect = resolve(shouldRedirect, currentRoute.value)
      return pushWithRedirect(
        {
          ...resolvedRedirect,
          state:
            typeof shouldRedirect === 'object'
              ? assign({}, data, shouldRedirect.state)
              : data,
          force,
        } as RouteLocationResolved,
        replace,
        // keep original redirectedFrom if it exists
        redirectedFrom || to
      )
    }

    // if it was a redirect we already called `pushWithRedirect` above
    const toLocation = to as RouteLocationNormalized

    toLocation.redirectedFrom = redirectedFrom
    let failure: NavigationFailure | void | undefined

    if (!force && isSameRouteLocation(stringifyQuery, from, to)) {
      failure = createRouterError<NavigationFailure>(
        ErrorTypes.NAVIGATION_DUPLICATED,
        { to: toLocation, from }
      )
      // trigger scroll to allow scrolling to the same anchor
      handleScroll(
        from,
        from,
        // this is a push, the only way for it to be triggered from a
        // history.listen is with a redirect, which makes it become a push
        true,
        // This cannot be the first navigation because the initial location
        // cannot be manually navigated to
        false
      )
    }

    return (failure ? Promise.resolve(failure) : navigate(toLocation, from))
      .catch((error: NavigationFailure | NavigationRedirectError) =>
        isNavigationFailure(error)
          ? // navigation redirects still mark the router as ready
            isNavigationFailure(error, ErrorTypes.NAVIGATION_GUARD_REDIRECT)
            ? error
            : markAsReady(error) // also returns the error
          : // reject any unknown error
            triggerError(error, toLocation, from)
      )
      .then((failure: NavigationFailure | NavigationRedirectError | void) => {
        if (failure) {
          if (
            isNavigationFailure(failure, ErrorTypes.NAVIGATION_GUARD_REDIRECT)
          ) {
            if (
              __DEV__ &&
              // we are redirecting to the same location we were already at
              isSameRouteLocation(
                stringifyQuery,
                // Properly resolve failure.to location 
                resolve(failure.to as RouteLocationRaw),
                toLocation
              ) &&
              // and we have done it a couple of times
              redirectedFrom &&
              // Track redirect count for dev warning (added only in dev)
              ((redirectedFrom as any)._count = (redirectedFrom as any)._count
                ? (redirectedFrom as any)._count + 1
                : 1) > 30
            ) {
              warn(
                `Detected a possibly infinite redirection in a navigation guard when going from "${from.fullPath}" to "${toLocation.fullPath}". Aborting to avoid a Stack Overflow.\n Are you always returning a new location within a navigation guard? That would lead to this error. Only return when redirecting or aborting, that should fix this. This might break in production if not fixed.`
              )
              return Promise.reject(
                new Error('Infinite redirect in navigation guard')
              )
            }

            return pushWithRedirect(
              {
                ...resolve(shouldRedirect as RouteLocationRaw, currentRoute.value),
                state:
                  typeof failure.to === 'object'
                    ? assign({}, data, (failure.to as any).state)
                    : data,
                force,
              } as RouteLocationResolved,
              // preserve an existing replacement but allow the redirect to override it
              replace,
              // preserve the original redirectedFrom if any
              redirectedFrom || toLocation
            )
          }
        } else {
          // if we fail we don't finalize the navigation
          failure = finalizeNavigation(
            toLocation as RouteLocationNormalizedLoaded,
            from,
            true,
            replace,
            data
          )
        }
        triggerAfterEach(
          toLocation as RouteLocationNormalizedLoaded,
          from,
          failure
        )
        return failure
      })
  }

  /**
   * Helper to reject and skip all navigation guards if a new navigation happened
   * @param to
   * @param from
   */
  function checkCanceledNavigationAndReject(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<void> {
    const error = checkCanceledNavigation(to, from)
    return error ? Promise.reject(error) : Promise.resolve()
  }

  function runWithContext<T>(fn: () => T): T {
    const app: App | undefined = installedApps.values().next().value
    // FIXME: remove safeguard and ensure
    // TODO: remove safeguard and bump required minimum version of Vue
    // support Vue < 3.3
    return typeof app?.runWithContext === 'function'
      ? app.runWithContext(fn)
      : fn()
  }

  // TODO: refactor the whole before guards by internally using router.beforeEach

  function navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded
  ): Promise<any> {
    let guards: Lazy<any>[]

    const [leavingRecords, updatingRecords, enteringRecords] =
      extractChangingRecords(to, from)

    // all components here have been resolved once because we are leaving
    guards = extractComponentsGuards(
      leavingRecords.reverse(),
      'beforeRouteLeave',
      to,
      from
    )

    // leavingRecords is already reversed
    for (const record of leavingRecords) {
      record.leaveGuards.forEach(guard => {
        guards.push(guardToPromiseFn(guard, to, from))
      })
    }

    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(
      null,
      to,
      from
    )

    guards.push(canceledNavigationCheck)

    // run the queue of per route beforeRouteLeave guards
    return (
      runGuardQueue(guards)
        .then(() => {
          // check global guards beforeEach
          guards = []
          for (const guard of beforeGuards.list()) {
            guards.push(guardToPromiseFn(guard, to, from))
          }
          guards.push(canceledNavigationCheck)

          return runGuardQueue(guards)
        })
        .then(() => {
          // check in components beforeRouteUpdate
          guards = extractComponentsGuards(
            updatingRecords,
            'beforeRouteUpdate',
            to,
            from
          )

          for (const record of updatingRecords) {
            record.updateGuards.forEach(guard => {
              guards.push(guardToPromiseFn(guard, to, from))
            })
          }
          guards.push(canceledNavigationCheck)

          // run the queue of per route beforeEnter guards
          return runGuardQueue(guards)
        })
        .then(() => {
          // check the route beforeEnter
          guards = []
          for (const record of enteringRecords) {
            // do not trigger beforeEnter on reused views
            if (record.beforeEnter) {
              if (isArray(record.beforeEnter)) {
                for (const beforeEnter of record.beforeEnter)
                  guards.push(guardToPromiseFn(beforeEnter, to, from))
              } else {
                guards.push(guardToPromiseFn(record.beforeEnter, to, from))
              }
            }
          }
          guards.push(canceledNavigationCheck)

          // run the queue of per route beforeEnter guards
          return runGuardQueue(guards)
        })
        .then(() => {
          // NOTE: at this point to.matched is normalized and does not contain any () => Promise<Component>

          // clear existing enterCallbacks, these are added by extractComponentsGuards
          to.matched.forEach(record => (record.enterCallbacks = {}))

          // check in-component beforeRouteEnter
          guards = extractComponentsGuards(
            enteringRecords,
            'beforeRouteEnter',
            to,
            from,
            runWithContext
          )
          guards.push(canceledNavigationCheck)

          // run the queue of per route beforeEnter guards
          return runGuardQueue(guards)
        })
        .then(() => {
          // check global guards beforeResolve
          guards = []
          for (const guard of beforeResolveGuards.list()) {
            guards.push(guardToPromiseFn(guard, to, from))
          }
          guards.push(canceledNavigationCheck)

          return runGuardQueue(guards)
        })
        // catch any navigation canceled
        .catch(err =>
          isNavigationFailure(err, ErrorTypes.NAVIGATION_CANCELLED)
            ? err
            : Promise.reject(err)
        )
    )
  }

  function triggerAfterEach(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void
  ): void {
    // navigation is confirmed, call afterGuards
    // TODO: wrap with error handlers
    afterGuards
      .list()
      .forEach(guard => runWithContext(() => guard(to, from, failure)))
  }

  /**
   * - Cleans up any navigation guards
   * - Changes the url if necessary
   * - Calls the scrollBehavior
   */
  function finalizeNavigation(
    toLocation: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    replace?: boolean,
    data?: HistoryState
  ): NavigationFailure | void {
    // a more recent navigation took place
    const error = checkCanceledNavigation(toLocation, from)
    if (error) return error

    // only consider as push if it's not the first navigation
    const isFirstNavigation = from === START_LOCATION_NORMALIZED
    const state: Partial<HistoryState> | null = !isBrowser ? {} : history.state

    // change URL only if the user did a push/replace and if it's not the initial navigation because
    // it's just reflecting the url
    if (isPush) {
      // on the initial navigation, we want to reuse the scroll position from
      // history state if it exists
      if (replace || isFirstNavigation)
        routerHistory.replace(
          toLocation.fullPath,
          assign(
            {
              scroll: isFirstNavigation && state && state.scroll,
            },
            data
          )
        )
      else routerHistory.push(toLocation.fullPath, data)
    }

    // accept current navigation
    currentRoute.value = toLocation
    handleScroll(toLocation, from, isPush, isFirstNavigation)

    markAsReady()
  }

  let removeHistoryListener: undefined | null | (() => void)
  // attach listener to history to trigger navigations
  function setupListeners() {
    // avoid setting up listeners twice due to an invalid first navigation
    if (removeHistoryListener) return
    removeHistoryListener = routerHistory.listen((to, _from, info) => {
      if (!router.listening) return
      // cannot be a redirect route because it was in history
      const toLocation = resolve(to) as RouteLocationNormalized

      // due to dynamic routing, and to hash history with manual navigation
      // (manually changing the url or calling history.hash = '#/somewhere'),
      // there could be a redirect record in history
      const shouldRedirect = handleRedirectRecord(toLocation)
      if (shouldRedirect) {
        const resolvedRedirect = resolve(shouldRedirect as RouteLocationRaw)
        pushWithRedirect(
          {
            ...resolvedRedirect,
            force: true
          } as RouteLocationResolved,
          true,
          toLocation
        ).catch(noop)
        return
      }

      pendingLocation = toLocation
      const from = currentRoute.value

      // TODO: should be moved to web history?
      if (isBrowser) {
        saveScrollPosition(
          getScrollKey(from.fullPath, info.delta),
          computeScrollPosition()
        )
      }

      navigate(toLocation, from)
        .catch((error: NavigationFailure | NavigationRedirectError) => {
          if (
            isNavigationFailure(
              error,
              ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_CANCELLED
            )
          ) {
            return error
          }
          if (
            isNavigationFailure(error, ErrorTypes.NAVIGATION_GUARD_REDIRECT)
          ) {
            // Here we could call if (info.delta) routerHistory.go(-info.delta,
            // false) but this is bug prone as we have no way to wait the
            // navigation to be finished before calling pushWithRedirect. Using
            // a setTimeout of 16ms seems to work but there is no guarantee for
            // it to work on every browser. So instead we do not restore the
            // history entry and trigger a new navigation as requested by the
            // navigation guard.

            // the error is already handled by router.push we just want to avoid
            // logging the error
            const resolvedError = resolve(
              // NavigationRedirectError.to should be a valid location
              (error as NavigationRedirectError).to as RouteLocationRaw
            )
            pushWithRedirect(
              {
                ...resolvedError,
                force: true,
              } as RouteLocationResolved,
              undefined,
              toLocation
              // avoid an uncaught rejection, let push call triggerError
            )
              .then(failure => {
                // manual change in hash history #916 ending up in the URL not
                // changing, but it was changed by the manual url change, so we
                // need to manually change it ourselves
                if (
                  isNavigationFailure(
                    failure,
                    ErrorTypes.NAVIGATION_ABORTED |
                      ErrorTypes.NAVIGATION_DUPLICATED
                  ) &&
                  !info.delta &&
                  info.type === NavigationType.pop
                ) {
                  routerHistory.go(-1, false)
                }
              })
              .catch(noop)
            // avoid the then branch
            return Promise.reject()
          }
          // do not restore history on unknown direction
          if (info.delta) {
            routerHistory.go(-info.delta, false)
          }
          // unrecognized error, transfer to the global handler
          return triggerError(error, toLocation, from)
        })
        .then((failure: NavigationFailure | void) => {
          failure =
            failure ||
            finalizeNavigation(
              // after navigation, all matched components are resolved
              toLocation as RouteLocationNormalizedLoaded,
              from,
              false
            )

          // revert the navigation
          if (failure) {
            if (
              info.delta &&
              // a new navigation has been triggered, so we do not want to revert, that will change the current history
              // entry while a different route is displayed
              !isNavigationFailure(failure, ErrorTypes.NAVIGATION_CANCELLED)
            ) {
              routerHistory.go(-info.delta, false)
            } else if (
              info.type === NavigationType.pop &&
              isNavigationFailure(
                failure,
                ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_DUPLICATED
              )
            ) {
              // manual change in hash history #916
              // it's like a push but lacks the information of the direction
              routerHistory.go(-1, false)
            }
          }

          triggerAfterEach(
            toLocation as RouteLocationNormalizedLoaded,
            from,
            failure
          )
        })
        // avoid warnings in the console about uncaught rejections, they are logged by triggerErrors
        .catch(noop)
    })
  }

  // Initialization and Errors
  let readyHandlers = useCallbacks<_OnReadyCallback>()
  let errorListeners = useCallbacks<_ErrorListener>()
  let ready: boolean

  /**
   * Trigger errorListeners added via onError and throws the error as well
   *
   * @param error - error to throw
   * @param to - location we were navigating to when the error happened
   * @param from - location we were navigating from when the error happened
   * @returns the error as a rejected promise
   */
  function triggerError(
    error: any,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded
  ): Promise<unknown> {
    markAsReady(error)
    const list = errorListeners.list()
    if (list.length) {
      list.forEach(handler => handler(error, to, from))
    } else {
      if (__DEV__) {
        warn('uncaught error during route navigation:')
      }
      console.error(error)
    }
    // reject the error no matter there were error listeners or not
    return Promise.reject(error)
  }

  function isReady(): Promise<void> {
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
      return Promise.resolve()
    return new Promise((resolve, reject) => {
      readyHandlers.add([resolve, reject])
    })
  }

  /**
   * Mark the router as ready, resolving the promised returned by isReady(). Can
   * only be called once, otherwise does nothing.
   * @param err - optional error
   */
  function markAsReady<E = unknown>(err: E): E
  function markAsReady(): void
  function markAsReady<E = unknown>(err?: E): E | void {
    if (!ready) {
      // still not ready if an error happened
      ready = !err
      setupListeners()
      readyHandlers
        .list()
        .forEach(([resolve, reject]) => (err ? reject(err) : resolve()))
      readyHandlers.reset()
    }
    return err
  }

  // Scroll behavior
  function handleScroll(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    isFirstNavigation: boolean
  ): // the return is not meant to be used
  Promise<unknown> {
    const { scrollBehavior } = options
    if (!isBrowser || !scrollBehavior) return Promise.resolve()

    const scrollPosition: _ScrollPositionNormalized | null =
      (!isPush && getSavedScrollPosition(getScrollKey(to.fullPath, 0))) ||
      ((isFirstNavigation || !isPush) &&
        (history.state as HistoryState) &&
        history.state.scroll) ||
      null

    return nextTick()
      .then(() => scrollBehavior(to, from, scrollPosition))
      .then(position => position && scrollToPosition(position))
      .catch(err => triggerError(err, to, from))
  }

  const go = (delta: number) => routerHistory.go(delta)

  let started: boolean | undefined
  const installedApps = new Set<App>()

  const router: EXPERIMENTAL_Router = {
    currentRoute,
    listening: true,

    hasRoute,
    getRoutes,
    // Fixed resolve method with proper type compatibility
    resolve: resolve as any,
    options,

    // Fixed push/replace methods with proper type compatibility  
    push: push as any,
    replace: replace as any,
    go,
    back: () => go(-1),
    forward: () => go(1),

    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,

    onError: errorListeners.add,
    isReady,

    install(app: App) {
      // Must be done by user for vapor variants
      // app.component('RouterLink', RouterLink)
      // app.component('RouterView', RouterView)

      // Fixed router injection with proper type compatibility
      app.config.globalProperties.$router = router as any
      Object.defineProperty(app.config.globalProperties, '$route', {
        enumerable: true,
        get: () => unref(currentRoute),
      })

      // this initial navigation is only necessary on client, on server it doesn't
      // make sense because it will create an extra unnecessary navigation and could
      // lead to problems
      if (
        isBrowser &&
        // used for the initial navigation client side to avoid pushing
        // multiple times when the router is used in multiple apps
        !started &&
        currentRoute.value === START_LOCATION_NORMALIZED
      ) {
        // see above
        started = true
        push(routerHistory.location).catch(err => {
          if (__DEV__) warn('Unexpected error when starting the router:', err)
        })
      }

      const reactiveRoute = {} as RouteLocationNormalizedLoaded
      for (const key in START_LOCATION_NORMALIZED) {
        Object.defineProperty(reactiveRoute, key, {
          get: () => currentRoute.value[key as keyof RouteLocationNormalized],
          enumerable: true,
        })
      }

      // Fixed router provider with proper type compatibility
      app.provide(routerKey, router as any)
      app.provide(routeLocationKey, shallowReactive(reactiveRoute))
      app.provide(routerViewLocationKey, currentRoute)

      installedApps.add(app)
      app.onUnmount(() => {
        installedApps.delete(app)
        // the router is not attached to an app anymore
        if (installedApps.size < 1) {
          // invalidate the current navigation
          pendingLocation = START_LOCATION_NORMALIZED
          removeHistoryListener && removeHistoryListener()
          removeHistoryListener = null
          currentRoute.value = START_LOCATION_NORMALIZED
          started = false
          ready = false
        }
      })

      // TODO: this probably needs to be updated so it can be used by vue-termui
      if ((__DEV__ || __FEATURE_PROD_DEVTOOLS__) && isBrowser) {
        // Fixed devtools integration with proper type compatibility
        addDevtools(app, router as any, resolver as any)
      }
    },
  }

  // TODO: type this as NavigationGuardReturn or similar instead of any
  function runGuardQueue(guards: Lazy<any>[]): Promise<any> {
    return guards.reduce(
      (promise, guard) => promise.then(() => runWithContext(guard)),
      Promise.resolve()
    )
  }

  return router
}

/**
 * Merge meta fields of an array of records
 *
 * @param matched - array of matched records
 */
function mergeMetaFields(
  matched: EXPERIMENTAL_RouteRecordNormalized[]
): RouteMeta {
  return assign({} as RouteMeta, ...matched.map(r => r.meta))
}
