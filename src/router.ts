import {
  RouteLocationNormalized,
  RouteRecordRaw,
  RouteLocationRaw,
  PostNavigationGuard,
  START_LOCATION_NORMALIZED,
  Lazy,
  TODO,
  MatcherLocation,
  RouteLocationNormalizedLoaded,
  RouteLocation,
  RouteRecordName,
  isRouteName,
  NavigationGuardWithThis,
  RouteLocationOptions,
} from './types'
import { RouterHistory, HistoryState } from './history/common'
import {
  ScrollPositionCoordinates,
  ScrollPosition,
  getSavedScrollPosition,
  getScrollKey,
  saveScrollPosition,
  computeScrollPosition,
  scrollToPosition,
} from './scrollBehavior'
import { createRouterMatcher } from './matcher'
import {
  createRouterError,
  ErrorTypes,
  NavigationFailure,
  NavigationRedirectError,
} from './errors'
import { applyToParams, isBrowser } from './utils'
import { useCallbacks } from './utils/callbacks'
import { encodeParam, decode, encodeHash } from './encoding'
import {
  normalizeQuery,
  parseQuery as originalParseQuery,
  stringifyQuery as originalStringifyQuery,
} from './query'
import { shallowRef, Ref, nextTick, App, warn } from 'vue'
import { RouteRecord, RouteRecordNormalized } from './matcher/types'
import { parseURL, stringifyURL, isSameRouteLocation } from './location'
import { extractComponentsGuards, guardToPromiseFn } from './navigationGuards'
import { applyRouterPlugin } from './install'

/**
 * Internal type to define an ErrorHandler
 * @internal
 */
export type ErrorHandler = (error: any) => any
// resolve, reject arguments of Promise constructor
type OnReadyCallback = [() => void, (reason?: any) => void]

type Awaitable<T> = T | Promise<T>

export interface ScrollBehavior {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    savedPosition: Required<ScrollPositionCoordinates> | null
  ): // TODO: implement false nad refactor promise based type
  Awaitable<ScrollPosition | false | void>
}

export interface RouterOptions {
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
   * Function to control scrolling when navigating between pages.
   */
  scrollBehavior?: ScrollBehavior
  /**
   * Custom implementation to parse a query.
   *
   * @example
   * Let's say you want to use the package {@link https://github.com/ljharb/qs | `qs`}
   * to parse queries, you would need to provide both `parseQuery` and
   * {@link RouterOptions.stringifyQuery | `stringifyQuery`}:
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
   * {@link RouterOptions.parseQuery | `parseQuery`} counterpart to handle query parsing.
   */
  stringifyQuery?: typeof originalStringifyQuery
  // TODO: allow customizing encoding functions
}

export interface Router {
  readonly history: RouterHistory
  readonly currentRoute: Ref<RouteLocationNormalizedLoaded>

  addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void
  addRoute(route: RouteRecordRaw): () => void
  removeRoute(name: RouteRecordName): void
  hasRoute(name: RouteRecordName): boolean
  getRoutes(): RouteRecord[]

  resolve(to: RouteLocationRaw): RouteLocation & { href: string }

  push(to: RouteLocationRaw): Promise<NavigationFailure | void>
  replace(to: RouteLocationRaw): Promise<NavigationFailure | void>
  // TODO: return a promise when https://github.com/vuejs/rfcs/pull/150 is
  // merged
  back(): void
  forward(): void
  go(delta: number): void

  beforeEach(guard: NavigationGuardWithThis<undefined>): () => void
  beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void
  afterEach(guard: PostNavigationGuard): () => void

  onError(handler: ErrorHandler): () => void
  isReady(): Promise<void>

  install(app: App): void
}

/**
 * Create a Router instance that can be used on a Vue app.
 *
 * @param options - {@link RouterOptions}
 */
export function createRouter({
  history,
  routes,
  scrollBehavior,
  parseQuery = originalParseQuery,
  stringifyQuery = originalStringifyQuery,
}: RouterOptions): Router {
  const matcher = createRouterMatcher(routes, {})

  const beforeGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
  const beforeResolveGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
  const afterGuards = useCallbacks<PostNavigationGuard>()
  const currentRoute = shallowRef<RouteLocationNormalizedLoaded>(
    START_LOCATION_NORMALIZED
  )
  let pendingLocation: RouteLocation = START_LOCATION_NORMALIZED

  if (isBrowser && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

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
    location: RouteLocationRaw,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocation & { href: string } {
    // const objectLocation = routerLocationAsObject(location)
    currentLocation = currentLocation || currentRoute.value
    if (typeof location === 'string') {
      let locationNormalized = parseURL(parseQuery, location)
      let matchedRoute = matcher.resolve(
        { path: locationNormalized.path },
        currentLocation
      )

      return {
        // fullPath: locationNormalized.fullPath,
        // query: locationNormalized.query,
        // hash: locationNormalized.hash,
        ...locationNormalized,
        ...matchedRoute,
        // path: matchedRoute.path,
        // name: matchedRoute.name,
        // meta: matchedRoute.meta,
        // matched: matchedRoute.matched,
        params: decodeParams(matchedRoute.params),
        redirectedFrom: undefined,
        href: history.base + locationNormalized.fullPath,
      }
    }

    let matchedRoute: MatcherLocation = // relative or named location, path is ignored
      // for same reason TS thinks location.params can be undefined
      matcher.resolve(
        'params' in location
          ? { ...location, params: encodeParams(location.params) }
          : location,
        currentLocation
      )

    const hash = encodeHash(location.hash || '')

    // put back the unencoded params as given by the user (avoid the cost of decoding them)
    // TODO: normalize params if we accept numbers as raw values
    matchedRoute.params =
      'params' in location
        ? location.params!
        : decodeParams(matchedRoute.params)

    const fullPath = stringifyURL(stringifyQuery, {
      ...location,
      hash,
      path: matchedRoute.path,
    })

    return {
      fullPath,
      // keep the hash encoded so fullPath is effectively path + encodedQuery +
      // hash
      hash,
      query: normalizeQuery(location.query),
      ...matchedRoute,
      redirectedFrom: undefined,
      href: history.base + fullPath,
    }
  }

  function locationAsObject(
    to: RouteLocationRaw | RouteLocationNormalized
  ): Exclude<RouteLocationRaw, string> | RouteLocationNormalized {
    return typeof to === 'string' ? { path: to } : to
  }

  function push(to: RouteLocationRaw | RouteLocation) {
    return pushWithRedirect(to)
  }

  function replace(to: RouteLocationRaw | RouteLocationNormalized) {
    return push({ ...locationAsObject(to), replace: true })
  }

  function pushWithRedirect(
    to: RouteLocationRaw | RouteLocation,
    redirectedFrom?: RouteLocation
  ): Promise<NavigationFailure | void> {
    const targetLocation: RouteLocation = (pendingLocation = resolve(to))
    const from = currentRoute.value
    const data: HistoryState | undefined = (to as RouteLocationOptions).state
    const force: boolean | undefined = (to as RouteLocationOptions).force
    // to could be a string where `replace` is a function
    const replace = (to as RouteLocationOptions).replace === true

    const lastMatched =
      targetLocation.matched[targetLocation.matched.length - 1]
    if (lastMatched && 'redirect' in lastMatched) {
      const { redirect } = lastMatched
      // transform it into an object to pass the original RouteLocaleOptions
      let newTargetLocation = locationAsObject(
        typeof redirect === 'function' ? redirect(targetLocation) : redirect
      )
      return pushWithRedirect(
        {
          ...targetLocation,
          ...newTargetLocation,
          state: data,
          force,
          replace,
        },
        // keep original redirectedFrom if it exists
        redirectedFrom || targetLocation
      )
    }

    // if it was a redirect we already called `pushWithRedirect` above
    const toLocation = targetLocation as RouteLocationNormalized

    toLocation.redirectedFrom = redirectedFrom
    let failure: NavigationFailure | void

    if (!force && isSameRouteLocation(from, targetLocation))
      failure = createRouterError<NavigationFailure>(
        ErrorTypes.NAVIGATION_DUPLICATED,
        { to: toLocation, from }
      )

    return (failure ? Promise.resolve(failure) : navigate(toLocation, from))
      .catch((error: NavigationFailure | NavigationRedirectError) => {
        // a more recent navigation took place
        if (pendingLocation !== toLocation) {
          return createRouterError<NavigationFailure>(
            ErrorTypes.NAVIGATION_CANCELLED,
            {
              from,
              to: toLocation,
            }
          )
        }
        if (
          error.type === ErrorTypes.NAVIGATION_ABORTED ||
          error.type === ErrorTypes.NAVIGATION_GUARD_REDIRECT
        ) {
          return error
        }
        // unknown error, rejects
        return triggerError(error)
      })
      .then((failure: NavigationFailure | NavigationRedirectError | void) => {
        if (failure) {
          if (failure.type === ErrorTypes.NAVIGATION_GUARD_REDIRECT)
            // preserve the original redirectedFrom if any
            return pushWithRedirect(
              // keep options
              {
                ...locationAsObject(failure.to),
                state: data,
                force,
                replace,
              },
              redirectedFrom || toLocation
            )
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

  function navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded
  ): Promise<TODO> {
    let guards: Lazy<any>[]

    // all components here have been resolved once because we are leaving
    // TODO: refactor both together
    guards = extractComponentsGuards(
      from.matched.filter(record => to.matched.indexOf(record) < 0).reverse(),
      'beforeRouteLeave',
      to,
      from
    )

    const [
      leavingRecords,
      updatingRecords,
      // enteringRecords,
    ] = extractChangingRecords(to, from)

    for (const record of leavingRecords) {
      for (const guard of record.leaveGuards) {
        guards.push(guardToPromiseFn(guard, to, from))
      }
    }

    // run the queue of per route beforeRouteLeave guards
    return runGuardQueue(guards)
      .then(() => {
        // check global guards beforeEach
        guards = []
        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from))
        }

        return runGuardQueue(guards)
      })
      .then(() => {
        // check in components beforeRouteUpdate
        guards = extractComponentsGuards(
          to.matched.filter(record => from.matched.indexOf(record as any) > -1),
          'beforeRouteUpdate',
          to,
          from
        )

        for (const record of updatingRecords) {
          for (const guard of record.updateGuards) {
            guards.push(guardToPromiseFn(guard, to, from))
          }
        }

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

        // run the queue of per route beforeEnter guards
        return runGuardQueue(guards)
      })
      .then(() => {
        // TODO: at this point to.matched is normalized and does not contain any () => Promise<Component>

        // check in-component beforeRouteEnter
        guards = extractComponentsGuards(
          // the type doesn't matter as we are comparing an object per reference
          to.matched.filter(record => from.matched.indexOf(record as any) < 0),
          'beforeRouteEnter',
          to,
          from
        )

        // run the queue of per route beforeEnter guards
        return runGuardQueue(guards)
      })
      .then(() => {
        // check global guards beforeEach
        guards = []
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from))
        }

        return runGuardQueue(guards)
      })
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
    if (pendingLocation !== toLocation) {
      return createRouterError<NavigationFailure>(
        ErrorTypes.NAVIGATION_CANCELLED,
        {
          from,
          to: toLocation,
        }
      )
    }

    const [leavingRecords] = extractChangingRecords(toLocation, from)
    for (const record of leavingRecords) {
      // remove registered guards from removed matched records
      record.leaveGuards = []
      // free the references

      // TODO: add tests
      record.instances = {}
    }

    // only consider as push if it's not the first navigation
    const isFirstNavigation = from === START_LOCATION_NORMALIZED
    const state = !isBrowser ? {} : window.history.state

    // change URL only if the user did a push/replace and if it's not the initial navigation because
    // it's just reflecting the url
    if (isPush) {
      // on the initial navigation, we want to reuse the scroll position from
      // history state if it exists
      if (replace || isFirstNavigation)
        history.replace(toLocation, {
          scroll: isFirstNavigation && state && state.scroll,
          ...data,
        })
      else history.push(toLocation, data)
    }

    // accept current navigation
    currentRoute.value = toLocation
    // TODO: this doesn't work on first load. Moving it to RouterView could allow automatically handling transitions too maybe
    // TODO: refactor with a state getter
    if (isBrowser) {
      const savedScroll = getSavedScrollPosition(
        getScrollKey(toLocation.fullPath, 0)
      )
      handleScroll(
        toLocation,
        from,
        savedScroll || ((isFirstNavigation || !isPush) && state && state.scroll)
      ).catch(err => {
        triggerError(err)
      })
    }

    markAsReady()
  }

  // attach listener to history to trigger navigations
  history.listen((to, _from, info) => {
    // TODO: in dev try catch to correctly log the matcher error
    // cannot be a redirect route because it was in history
    const toLocation = resolve(to.fullPath) as RouteLocationNormalized

    pendingLocation = toLocation
    const from = currentRoute.value

    if (isBrowser) {
      saveScrollPosition(
        getScrollKey(from.fullPath, info.delta),
        computeScrollPosition()
      )
    }

    navigate(toLocation, from)
      .catch((error: NavigationFailure | NavigationRedirectError) => {
        // a more recent navigation took place
        if (pendingLocation !== toLocation) {
          return createRouterError<NavigationFailure>(
            ErrorTypes.NAVIGATION_CANCELLED,
            {
              from,
              to: toLocation,
            }
          )
        }
        if (error.type === ErrorTypes.NAVIGATION_ABORTED) {
          return error as NavigationFailure
        }
        if (error.type === ErrorTypes.NAVIGATION_GUARD_REDIRECT) {
          history.go(-info.delta, false)
          // the error is already handled by router.push we just want to avoid
          // logging the error
          pushWithRedirect(
            (error as NavigationRedirectError).to,
            toLocation
            // TODO: in dev show warning, in prod noop, same as initial navigation
          )
          // avoid the then branch
          return Promise.reject()
        }
        // TODO: test on different browsers ensure consistent behavior
        history.go(-info.delta, false)
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
        if (failure) history.go(-info.delta, false)

        triggerAfterEach(
          toLocation as RouteLocationNormalizedLoaded,
          from,
          failure
        )
      })
      .catch(() => {})
  })

  // Initialization and Errors

  let readyHandlers = useCallbacks<OnReadyCallback>()
  let errorHandlers = useCallbacks<ErrorHandler>()
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

  /**
   * Returns a Promise that resolves or reject when the router has finished its
   * initial navigation. This will be automatic on client but requires an
   * explicit `router.push` call on the server. This behavior can change
   * depending on the history implementation used e.g. the defaults history
   * implementation (client only) triggers this automatically but the memory one
   * (should be used on server) doesn't
   */
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
    readyHandlers
      .list()
      .forEach(([resolve, reject]) => (err ? reject(err) : resolve()))
    readyHandlers.reset()
  }

  // Scroll behavior

  function handleScroll(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    scrollPosition?: Required<ScrollPositionCoordinates>
  ) {
    if (!scrollBehavior) return Promise.resolve()

    return nextTick()
      .then(() => scrollBehavior(to, from, scrollPosition || null))
      .then(position => position && scrollToPosition(position))
  }

  const router: Router = {
    currentRoute,

    addRoute,
    removeRoute,
    hasRoute,
    getRoutes,
    resolve,

    push,
    replace,
    go: history.go,
    back: () => history.go(-1),
    forward: () => history.go(1),

    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,

    onError: errorHandlers.add,
    isReady,

    history,
    install(app: App) {
      applyRouterPlugin(app, this)
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

  // TODO: could be optimized with one single for loop
  for (const record of from.matched) {
    if (to.matched.indexOf(record) < 0) leavingRecords.push(record)
    else updatingRecords.push(record)
  }

  for (const record of to.matched) {
    // the type doesn't matter because we are comparing per reference
    if (from.matched.indexOf(record as any) < 0) enteringRecords.push(record)
  }

  return [leavingRecords, updatingRecords, enteringRecords]
}
