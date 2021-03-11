import {
  RouteLocationNormalized,
  RouteRecordRaw,
  RouteLocationRaw,
  NavigationHookAfter,
  START_LOCATION_NORMALIZED,
  Lazy,
  RouteLocationNormalizedLoaded,
  RouteLocation,
  RouteRecordName,
  isRouteName,
  NavigationGuardWithThis,
  RouteLocationOptions,
  MatcherLocationRaw,
} from './types'
import { RouterHistory, HistoryState } from './history/common'
import {
  ScrollPosition,
  getSavedScrollPosition,
  getScrollKey,
  saveScrollPosition,
  computeScrollPosition,
  scrollToPosition,
  _ScrollPositionNormalized,
} from './scrollBehavior'
import { createRouterMatcher, PathParserOptions } from './matcher'
import {
  createRouterError,
  ErrorTypes,
  NavigationFailure,
  NavigationRedirectError,
  isNavigationFailure,
} from './errors'
import { applyToParams, isBrowser, assign, noop } from './utils'
import { useCallbacks } from './utils/callbacks'
import { encodeParam, decode, encodeHash } from './encoding'
import {
  normalizeQuery,
  parseQuery as originalParseQuery,
  stringifyQuery as originalStringifyQuery,
  LocationQuery,
} from './query'
import {
  shallowRef,
  Ref,
  nextTick,
  App,
  ComputedRef,
  reactive,
  unref,
  computed,
} from 'vue'
import { RouteRecord, RouteRecordNormalized } from './matcher/types'
import {
  parseURL,
  stringifyURL,
  isSameRouteLocation,
  isSameRouteRecord,
} from './location'
import { extractComponentsGuards, guardToPromiseFn } from './navigationGuards'
import { warn } from './warning'
import { RouterLink } from './RouterLink'
import { RouterView } from './RouterView'
import {
  routeLocationKey,
  routerKey,
  routerViewLocationKey,
} from './injectionSymbols'
import { addDevtools } from './devtools'

/**
 * Internal type to define an ErrorHandler
 * @internal
 */
export type _ErrorHandler = (error: any) => any
// resolve, reject arguments of Promise constructor
type OnReadyCallback = [() => void, (reason?: any) => void]

type Awaitable<T> = T | Promise<T>

/**
 * Type of the `scrollBehavior` option that can be passed to `createRouter`.
 */
export interface RouterScrollBehavior {
  /**
   * @param to - Route location where we are navigating to
   * @param from - Route location where we are navigating from
   * @param savedPosition - saved position if it exists, `null` otherwise
   */
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    savedPosition: _ScrollPositionNormalized | null
  ): Awaitable<ScrollPosition | false | void>
}

/**
 * Options to initialize a {@link Router} instance.
 */
export interface RouterOptions extends PathParserOptions {
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
   * Initial list of routes that should be added to the router.
   */
  routes: RouteRecordRaw[]
  /**
   * Function to control scrolling when navigating between pages. Can return a
   * Promise to delay scrolling. Check {@link ScrollBehavior}.
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
   * {@link RouterOptions.stringifyQuery}.
   *
   * @example
   * Let's say you want to use the package {@link https://github.com/ljharb/qs | qs}
   * to parse queries, you can provide both `parseQuery` and `stringifyQuery`:
   * ```js
   * import qs from 'qs'
   *
   * createRouter({
   *   // other options...
   *   parse: qs.parse,
   *   stringifyQuery: qs.stringify,
   * })
   * ```
   */
  parseQuery?: typeof originalParseQuery
  /**
   * Custom implementation to stringify a query object. Should not prepend a leading `?`.
   * {@link RouterOptions.parseQuery | parseQuery} counterpart to handle query parsing.
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
   * Default class applied to non active {@link RouterLink}. If none is provided,
   * `router-link-inactive` will be applied.
   */
  // linkInactiveClass?: string
}

/**
 * Router instance
 */
export interface Router {
  /**
   * @internal
   */
  // readonly history: RouterHistory
  /**
   * Current {@link RouteLocationNormalized}
   */
  readonly currentRoute: Ref<RouteLocationNormalizedLoaded>
  /**
   * Original options object passed to create the Router
   */
  readonly options: RouterOptions

  /**
   * Add a new {@link RouteRecordRaw | Route Record} as the child of an existing route.
   *
   * @param parentName - Parent Route Record where `route` should be appended at
   * @param route - Route Record to add
   */
  addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void
  /**
   * Add a new {@link RouteRecordRaw | route record} to the router.
   *
   * @param route - Route Record to add
   */
  addRoute(route: RouteRecordRaw): () => void
  /**
   * Remove an existing route by its name.
   *
   * @param name - Name of the route to remove
   */
  removeRoute(name: RouteRecordName): void
  /**
   * Checks if a route with a given name exists
   *
   * @param name - Name of the route to check
   */
  hasRoute(name: RouteRecordName): boolean
  /**
   * Get a full list of all the {@link RouteRecord | route records}.
   */
  getRoutes(): RouteRecord[]

  /**
   * Returns the {@link RouteLocation | normalized version} of a
   * {@link RouteLocationRaw | route location}. Also includes an `href` property
   * that includes any existing `base`.
   *
   * @param to - Raw route location to resolve
   */
  resolve(to: RouteLocationRaw): RouteLocation & { href: string }

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
  back(): ReturnType<Router['go']>
  /**
   * Go forward in history if possible by calling `history.forward()`.
   * Equivalent to `router.go(1)`.
   */
  forward(): ReturnType<Router['go']>
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
   * @example
   * ```js
   * router.beforeEach(to => {
   *   if (to.meta.requiresAuth && !isAuthenticated) return false
   * })
   * ```
   *
   * @param guard - navigation guard to add
   */
  beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void
  /**
   * Add a navigation hook that is executed after every navigation. Returns a
   * function that removes the registered hook.
   *
   * @example
   * ```js
   * router.afterEach((to, from, failure) => {
   *   if (isNavigationFailure(failure)) {
   *     console.log('failed navigation', failure)
   *   }
   * })
   * ```
   *
   * @param guard - navigation hook to add
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
  onError(handler: _ErrorHandler): () => void
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
   * the user.
   *
   * @internal
   * @param app - Application that uses the router
   */
  install(app: App): void
}

/**
 * Creates a Router instance that can be used by a Vue app.
 *
 * @param options - {@link RouterOptions}
 */
export function createRouter(options: RouterOptions): Router {
  const matcher = createRouterMatcher(options.routes, options)
  let parseQuery = options.parseQuery || originalParseQuery
  let stringifyQuery = options.stringifyQuery || originalStringifyQuery
  let routerHistory = options.history

  const beforeGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
  const beforeResolveGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
  const afterGuards = useCallbacks<NavigationHookAfter>()
  const currentRoute = shallowRef<RouteLocationNormalizedLoaded>(
    START_LOCATION_NORMALIZED
  )
  let pendingLocation: RouteLocation = START_LOCATION_NORMALIZED

  // leave the scrollRestoration if no scrollBehavior is provided
  if (isBrowser && options.scrollBehavior && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }

  const normalizeParams = applyToParams.bind(
    null,
    paramValue => '' + paramValue
  )
  const encodeParams = applyToParams.bind(null, encodeParam)
  const decodeParams = applyToParams.bind(null, decode)

  function addRoute(
    parentOrRoute: RouteRecordName | RouteRecordRaw,
    route?: RouteRecordRaw
  ) {
    let parent: Parameters<typeof matcher['addRoute']>[1] | undefined
    let record: RouteRecordRaw
    if (isRouteName(parentOrRoute)) {
      parent = matcher.getRecordMatcher(parentOrRoute)
      record = route!
    } else {
      record = parentOrRoute
    }

    return matcher.addRoute(record, parent)
  }

  function removeRoute(name: RouteRecordName) {
    let recordMatcher = matcher.getRecordMatcher(name)
    if (recordMatcher) {
      matcher.removeRoute(recordMatcher)
    } else if (__DEV__) {
      warn(`Cannot remove non-existent route "${String(name)}"`)
    }
  }

  function getRoutes() {
    return matcher.getRoutes().map(routeMatcher => routeMatcher.record)
  }

  function hasRoute(name: RouteRecordName): boolean {
    return !!matcher.getRecordMatcher(name)
  }

  function resolve(
    rawLocation: Readonly<RouteLocationRaw>,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocation & { href: string } {
    // const objectLocation = routerLocationAsObject(rawLocation)
    // we create a copy to modify it later
    currentLocation = assign({}, currentLocation || currentRoute.value)
    if (typeof rawLocation === 'string') {
      let locationNormalized = parseURL(
        parseQuery,
        rawLocation,
        currentLocation.path
      )
      let matchedRoute = matcher.resolve(
        { path: locationNormalized.path },
        currentLocation
      )

      let href = routerHistory.createHref(locationNormalized.fullPath)
      if (__DEV__) {
        if (href.startsWith('//'))
          warn(
            `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`
          )
        else if (!matchedRoute.matched.length) {
          warn(`No match found for location with path "${rawLocation}"`)
        }
      }

      // locationNormalized is always a new object
      return assign(locationNormalized, matchedRoute, {
        params: decodeParams(matchedRoute.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: undefined,
        href,
      })
    }

    let matcherLocation: MatcherLocationRaw

    // path could be relative in object as well
    if ('path' in rawLocation) {
      if (
        __DEV__ &&
        'params' in rawLocation &&
        !('name' in rawLocation) &&
        Object.keys((rawLocation as any).params).length
      ) {
        warn(
          `Path "${
            (rawLocation as any).path
          }" was passed with params but they will be ignored. Use a named route alongside params instead.`
        )
      }
      matcherLocation = assign({}, rawLocation, {
        path: parseURL(parseQuery, rawLocation.path, currentLocation.path).path,
      })
    } else {
      // pass encoded values to the matcher so it can produce encoded path and fullPath
      matcherLocation = assign({}, rawLocation, {
        params: encodeParams(rawLocation.params),
      })
      // current location params are decoded, we need to encode them in case the
      // matcher merges the params
      currentLocation.params = encodeParams(currentLocation.params)
    }

    let matchedRoute = matcher.resolve(matcherLocation, currentLocation)
    const hash = rawLocation.hash || ''

    if (__DEV__ && hash && !hash.startsWith('#')) {
      warn(
        `A \`hash\` should always start with the character "#". Replace "${hash}" with "#${hash}".`
      )
    }

    // decoding them) the matcher might have merged current location params so
    // we need to run the decoding again
    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params))

    const fullPath = stringifyURL(
      stringifyQuery,
      assign({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path,
      })
    )

    let href = routerHistory.createHref(fullPath)
    if (__DEV__) {
      if (href.startsWith('//')) {
        warn(
          `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`
        )
      } else if (!matchedRoute.matched.length) {
        warn(
          `No match found for location with path "${
            'path' in rawLocation ? rawLocation.path : rawLocation
          }"`
        )
      }
    }

    return assign(
      {
        fullPath,
        // keep the hash encoded so fullPath is effectively path + encodedQuery +
        // hash
        hash,
        query:
          // if the user is using a custom query lib like qs, we might have
          // nested objects, so we keep the query as is, meaning it can contain
          // numbers at `$route.query`, but at the point, the user will have to
          // use their own type anyway.
          // https://github.com/vuejs/vue-router-next/issues/328#issuecomment-649481567
          stringifyQuery === originalStringifyQuery
            ? normalizeQuery(rawLocation.query)
            : (rawLocation.query as LocationQuery),
      },
      matchedRoute,
      {
        redirectedFrom: undefined,
        href,
      }
    )
  }

  function locationAsObject(
    to: RouteLocationRaw | RouteLocationNormalized
  ): Exclude<RouteLocationRaw, string> | RouteLocationNormalized {
    return typeof to === 'string'
      ? parseURL(parseQuery, to, currentRoute.value.path)
      : assign({}, to)
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

  function push(to: RouteLocationRaw | RouteLocation) {
    return pushWithRedirect(to)
  }

  function replace(to: RouteLocationRaw | RouteLocationNormalized) {
    return push(assign(locationAsObject(to), { replace: true }))
  }

  function handleRedirectRecord(to: RouteLocation): RouteLocationRaw | void {
    const lastMatched = to.matched[to.matched.length - 1]
    if (lastMatched && lastMatched.redirect) {
      const { redirect } = lastMatched
      let newTargetLocation =
        typeof redirect === 'function' ? redirect(to) : redirect

      if (typeof newTargetLocation === 'string') {
        newTargetLocation =
          newTargetLocation.indexOf('?') > -1 ||
          newTargetLocation.indexOf('#') > -1
            ? (newTargetLocation = locationAsObject(newTargetLocation))
            : { path: newTargetLocation }
      }

      if (
        __DEV__ &&
        !('path' in newTargetLocation) &&
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
          params: to.params,
        },
        newTargetLocation
      )
    }
  }

  function pushWithRedirect(
    to: RouteLocationRaw | RouteLocation,
    redirectedFrom?: RouteLocation
  ): Promise<NavigationFailure | void | undefined> {
    const targetLocation: RouteLocation = (pendingLocation = resolve(to))
    const from = currentRoute.value
    const data: HistoryState | undefined = (to as RouteLocationOptions).state
    const force: boolean | undefined = (to as RouteLocationOptions).force
    // to could be a string where `replace` is a function
    const replace = (to as RouteLocationOptions).replace === true

    const shouldRedirect = handleRedirectRecord(targetLocation)

    if (shouldRedirect)
      return pushWithRedirect(
        assign(locationAsObject(shouldRedirect), {
          state: data,
          force,
          replace,
        }),
        // keep original redirectedFrom if it exists
        redirectedFrom || targetLocation
      )

    // if it was a redirect we already called `pushWithRedirect` above
    const toLocation = targetLocation as RouteLocationNormalized

    toLocation.redirectedFrom = redirectedFrom
    let failure: NavigationFailure | void | undefined

    if (!force && isSameRouteLocation(stringifyQuery, from, targetLocation)) {
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
          ? error
          : // reject any unknown error
            triggerError(error)
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
                resolve(failure.to),
                toLocation
              ) &&
              // and we have done it a couple of times
              redirectedFrom &&
              // @ts-ignore
              (redirectedFrom._count = redirectedFrom._count
                ? // @ts-ignore
                  redirectedFrom._count + 1
                : 1) > 10
            ) {
              warn(
                `Detected an infinite redirection in a navigation guard when going from "${from.fullPath}" to "${toLocation.fullPath}". Aborting to avoid a Stack Overflow. This will break in production if not fixed.`
              )
              return Promise.reject(
                new Error('Infinite redirect in navigation guard')
              )
            }

            return pushWithRedirect(
              // keep options
              assign(locationAsObject(failure.to), {
                state: data,
                force,
                replace,
              }),
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

  // TODO: refactor the whole before guards by internally using router.beforeEach

  function navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded
  ): Promise<any> {
    let guards: Lazy<any>[]

    const [
      leavingRecords,
      updatingRecords,
      enteringRecords,
    ] = extractChangingRecords(to, from)

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
          for (const record of to.matched) {
            // do not trigger beforeEnter on reused views
            if (record.beforeEnter && from.matched.indexOf(record as any) < 0) {
              if (Array.isArray(record.beforeEnter)) {
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
            from
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
    for (const guard of afterGuards.list()) guard(to, from, failure)
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
    const state = !isBrowser ? {} : history.state

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

  let removeHistoryListener: () => void
  // attach listener to history to trigger navigations
  function setupListeners() {
    removeHistoryListener = routerHistory.listen((to, _from, info) => {
      // cannot be a redirect route because it was in history
      let toLocation = resolve(to) as RouteLocationNormalized

      // due to dynamic routing, and to hash history with manual navigation
      // (manually changing the url or calling history.hash = '#/somewhere'),
      // there could be a redirect record in history
      const shouldRedirect = handleRedirectRecord(toLocation)
      if (shouldRedirect) {
        pushWithRedirect(
          assign(shouldRedirect, { replace: true }),
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
            // a setTimeout of 16ms seems to work but there is not guarantee for
            // it to work on every browser. So Instead we do not restore the
            // history entry and trigger a new navigation as requested by the
            // navigation guard.

            // the error is already handled by router.push we just want to avoid
            // logging the error
            pushWithRedirect(
              (error as NavigationRedirectError).to,
              toLocation
              // avoid an uncaught rejection, let push call triggerError
            ).catch(noop)
            // avoid the then branch
            return Promise.reject()
          }
          // do not restore history on unknown direction
          if (info.delta) routerHistory.go(-info.delta, false)
          // unrecognized error, transfer to the global handler
          return triggerError(error)
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
          if (failure && info.delta) routerHistory.go(-info.delta, false)

          triggerAfterEach(
            toLocation as RouteLocationNormalizedLoaded,
            from,
            failure
          )
        })
        .catch(noop)
    })
  }

  // Initialization and Errors

  let readyHandlers = useCallbacks<OnReadyCallback>()
  let errorHandlers = useCallbacks<_ErrorHandler>()
  let ready: boolean

  /**
   * Trigger errorHandlers added via onError and throws the error as well
   * @param error - error to throw
   * @returns the error as a rejected promise
   */
  function triggerError(error: any) {
    markAsReady(error)
    errorHandlers.list().forEach(handler => handler(error))
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
  function markAsReady(err?: any): void {
    if (ready) return
    ready = true
    setupListeners()
    readyHandlers
      .list()
      .forEach(([resolve, reject]) => (err ? reject(err) : resolve()))
    readyHandlers.reset()
  }

  // Scroll behavior
  function handleScroll(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    isFirstNavigation: boolean
  ): Promise<any> {
    const { scrollBehavior } = options
    if (!isBrowser || !scrollBehavior) return Promise.resolve()

    let scrollPosition: _ScrollPositionNormalized | null =
      (!isPush && getSavedScrollPosition(getScrollKey(to.fullPath, 0))) ||
      ((isFirstNavigation || !isPush) &&
        (history.state as HistoryState) &&
        history.state.scroll) ||
      null

    return nextTick()
      .then(() => scrollBehavior!(to, from, scrollPosition))
      .then(position => position && scrollToPosition(position))
      .catch(triggerError)
  }

  const go = (delta: number) => routerHistory.go(delta)

  let started: boolean | undefined
  const installedApps = new Set<App>()

  const router: Router = {
    currentRoute,

    addRoute,
    removeRoute,
    hasRoute,
    getRoutes,
    resolve,
    options,

    push,
    replace,
    go,
    back: () => go(-1),
    forward: () => go(1),

    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,

    onError: errorHandlers.add,
    isReady,

    install(app: App) {
      const router = this
      app.component('RouterLink', RouterLink)
      app.component('RouterView', RouterView)

      app.config.globalProperties.$router = router
      Object.defineProperty(app.config.globalProperties, '$route', {
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

      const reactiveRoute = {} as {
        [k in keyof RouteLocationNormalizedLoaded]: ComputedRef<
          RouteLocationNormalizedLoaded[k]
        >
      }
      for (let key in START_LOCATION_NORMALIZED) {
        // @ts-ignore: the key matches
        reactiveRoute[key] = computed(() => currentRoute.value[key])
      }

      app.provide(routerKey, router)
      app.provide(routeLocationKey, reactive(reactiveRoute))
      app.provide(routerViewLocationKey, currentRoute)

      let unmountApp = app.unmount
      installedApps.add(app)
      app.unmount = function () {
        installedApps.delete(app)
        if (installedApps.size < 1) {
          removeHistoryListener()
          currentRoute.value = START_LOCATION_NORMALIZED
          started = false
          ready = false
        }
        unmountApp()
      }

      if ((__DEV__ || __FEATURE_PROD_DEVTOOLS__) && __BROWSER__) {
        addDevtools(app, router, matcher)
      }
    },
  }

  return router
}

function runGuardQueue(guards: Lazy<any>[]): Promise<void> {
  return guards.reduce(
    (promise, guard) => promise.then(() => guard()),
    Promise.resolve()
  )
}

function extractChangingRecords(
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded
) {
  const leavingRecords: RouteRecordNormalized[] = []
  const updatingRecords: RouteRecordNormalized[] = []
  const enteringRecords: RouteRecordNormalized[] = []

  const len = Math.max(from.matched.length, to.matched.length)
  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i]
    if (recordFrom) {
      if (to.matched.find(isSameRouteRecord.bind(null, recordFrom)))
        updatingRecords.push(recordFrom)
      else leavingRecords.push(recordFrom)
    }
    const recordTo = to.matched[i]
    if (recordTo) {
      // the type doesn't matter because we are comparing per reference
      if (from.matched.indexOf(recordTo as any) < 0)
        enteringRecords.push(recordTo)
    }
  }

  return [leavingRecords, updatingRecords, enteringRecords]
}
