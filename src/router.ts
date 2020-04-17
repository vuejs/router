import {
  RouteLocationNormalized,
  RouteRecordRaw,
  RouteLocationRaw,
  NavigationGuard,
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
} from './types'
import { RouterHistory, HistoryState } from './history/common'
import {
  ScrollToPosition,
  ScrollPosition,
  scrollToPosition,
  saveScrollOnLeave,
  getScrollKey,
  getSavedScroll,
} from './utils/scroll'
import { createRouterMatcher } from './matcher'
import {
  createRouterError,
  ErrorTypes,
  NavigationFailure,
  NavigationRedirectError,
} from './errors'
import {
  applyToParams,
  isSameRouteRecord,
  isSameLocationObject,
  isBrowser,
} from './utils'
import { useCallbacks } from './utils/callbacks'
import { encodeParam, decode } from './utils/encoding'
import {
  normalizeQuery,
  parseQuery as originalParseQuery,
  stringifyQuery as originalStringifyQuery,
} from './utils/query'
import {
  ref,
  Ref,
  markRaw,
  nextTick,
  App,
  warn,
  computed,
  reactive,
  ComputedRef,
} from 'vue'
import { RouteRecord, RouteRecordNormalized } from './matcher/types'
import { Link } from './components/Link'
import { View } from './components/View'
import { routerKey, routeLocationKey } from './utils/injectionSymbols'
import { parseURL, stringifyURL } from './utils/location'
import { extractComponentsGuards, guardToPromiseFn } from './navigationGuards'

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
    savedPosition: ScrollToPosition | null
  ): // TODO: implement false nad refactor promise based type
  Awaitable<ScrollPosition | false | void>
}

export interface RouterOptions {
  history: RouterHistory
  routes: RouteRecordRaw[]
  scrollBehavior?: ScrollBehavior
  parseQuery?: typeof originalParseQuery
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

  beforeEach(guard: NavigationGuardWithThis<undefined>): () => void
  afterEach(guard: PostNavigationGuard): () => void

  onError(handler: ErrorHandler): () => void
  isReady(): Promise<void>

  install(app: App): void
}

export function createRouter({
  history,
  routes,
  scrollBehavior,
  parseQuery = originalParseQuery,
  stringifyQuery = originalStringifyQuery,
}: RouterOptions): Router {
  const matcher = createRouterMatcher(routes, {})

  const beforeGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
  const afterGuards = useCallbacks<PostNavigationGuard>()
  const currentRoute = ref<RouteLocationNormalizedLoaded>(
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

    // put back the unencoded params as given by the user (avoid the cost of decoding them)
    // TODO: normalize params if we accept numbers as raw values
    matchedRoute.params =
      'params' in location
        ? location.params!
        : decodeParams(matchedRoute.params)

    const fullPath = stringifyURL(stringifyQuery, {
      ...location,
      path: matchedRoute.path,
    })

    return {
      fullPath,
      hash: location.hash || '',
      query: normalizeQuery(location.query),
      ...matchedRoute,
      redirectedFrom: undefined,
      href: history.base + fullPath,
    }
  }

  function push(to: RouteLocationRaw | RouteLocation) {
    return pushWithRedirect(to, undefined)
  }

  function replace(to: RouteLocationRaw | RouteLocationNormalized) {
    const location = typeof to === 'string' ? { path: to } : to
    return push({ ...location, replace: true })
  }

  async function pushWithRedirect(
    to: RouteLocationRaw | RouteLocation,
    redirectedFrom: RouteLocation | undefined
  ): Promise<NavigationFailure | void> {
    const targetLocation: RouteLocation = (pendingLocation = resolve(to))
    const from = currentRoute.value
    const data: HistoryState | undefined = (to as any).state
    // @ts-ignore: no need to check the string as force do not exist on a string
    const force: boolean | undefined = to.force

    if (!force && isSameRouteLocation(from, targetLocation)) return

    const lastMatched =
      targetLocation.matched[targetLocation.matched.length - 1]
    if (lastMatched && 'redirect' in lastMatched) {
      const { redirect } = lastMatched
      return pushWithRedirect(
        typeof redirect === 'function' ? redirect(targetLocation) : redirect,
        // keep original redirectedFrom if it exists
        redirectedFrom || targetLocation
      )
    }

    // if it was a redirect we already called `pushWithRedirect` above
    const toLocation = targetLocation as RouteLocationNormalized

    toLocation.redirectedFrom = redirectedFrom
    let failure: NavigationFailure | void

    // trigger all guards, throw if navigation is rejected
    try {
      await navigate(toLocation, from)
    } catch (error) {
      // a more recent navigation took place
      if (pendingLocation !== toLocation) {
        failure = createRouterError<NavigationFailure>(
          ErrorTypes.NAVIGATION_CANCELLED,
          {
            from,
            to: toLocation,
          }
        )
      } else if (error.type === ErrorTypes.NAVIGATION_ABORTED) {
        failure = error as NavigationFailure
      } else if (error.type === ErrorTypes.NAVIGATION_GUARD_REDIRECT) {
        // preserve the original redirectedFrom if any
        return pushWithRedirect(
          (error as NavigationRedirectError).to,
          redirectedFrom || toLocation
        )
      } else {
        // unknown error, throws
        triggerError(error, true)
      }
    }

    // if we fail we don't finalize the navigation
    failure =
      failure ||
      finalizeNavigation(
        toLocation as RouteLocationNormalizedLoaded,
        from,
        true,
        // RouteLocationNormalized will give undefined
        (to as RouteLocationRaw).replace === true,
        data
      )

    triggerAfterEach(toLocation as RouteLocationNormalizedLoaded, from, failure)

    return failure
  }

  async function navigate(
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
      // updatingRecords,
      // enteringRecords,
    ] = extractChangingRecords(to, from)

    for (const record of leavingRecords) {
      for (const guard of record.leaveGuards) {
        guards.push(guardToPromiseFn(guard, to, from))
      }
    }

    // run the queue of per route beforeRouteLeave guards
    await runGuardQueue(guards)

    // check global guards beforeEach
    guards = []
    for (const guard of beforeGuards.list()) {
      guards.push(guardToPromiseFn(guard, to, from))
    }

    await runGuardQueue(guards)

    // check in components beforeRouteUpdate
    guards = extractComponentsGuards(
      to.matched.filter(record => from.matched.indexOf(record as any) > -1),
      'beforeRouteUpdate',
      to,
      from
    )

    // run the queue of per route beforeEnter guards
    await runGuardQueue(guards)

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
    await runGuardQueue(guards)

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
    await runGuardQueue(guards)
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

    // change URL only if the user did a push/replace and if it's not the initial navigation because
    // it's just reflecting the url
    if (isPush) {
      if (replace || isFirstNavigation) history.replace(toLocation, data)
      else history.push(toLocation, data)
    }

    // accept current navigation
    currentRoute.value = markRaw(toLocation)
    // TODO: this doesn't work on first load. Moving it to RouterView could allow automatically handling transitions too maybe
    // TODO: refactor with a state getter
    const state = isPush || !isBrowser ? {} : window.history.state
    const savedScroll = getSavedScroll(getScrollKey(toLocation.fullPath, 0))
    handleScroll(
      toLocation,
      from,
      savedScroll || (state && state.scroll)
    ).catch(err => triggerError(err))

    markAsReady()
  }

  // attach listener to history to trigger navigations
  history.listen(async (to, _from, info) => {
    // TODO: try catch to correctly log the matcher error
    // cannot be a redirect route because it was in history
    const toLocation = resolve(to.fullPath) as RouteLocationNormalized

    pendingLocation = toLocation
    const from = currentRoute.value

    saveScrollOnLeave(getScrollKey(from.fullPath, info.distance))

    let failure: NavigationFailure | void

    try {
      // TODO: refactor using then/catch because no need for async/await + try catch
      await navigate(toLocation, from)
    } catch (error) {
      // a more recent navigation took place
      if (pendingLocation !== toLocation) {
        failure = createRouterError<NavigationFailure>(
          ErrorTypes.NAVIGATION_CANCELLED,
          {
            from,
            to: toLocation,
          }
        )
      } else if (error.type === ErrorTypes.NAVIGATION_ABORTED) {
        failure = error as NavigationFailure
      } else if (error.type === ErrorTypes.NAVIGATION_GUARD_REDIRECT) {
        history.go(-info.distance, false)
        // the error is already handled by router.push we just want to avoid
        // logging the error
        return pushWithRedirect(
          (error as NavigationRedirectError).to,
          toLocation
        ).catch(() => {})
      } else {
        // TODO: test on different browsers ensure consistent behavior
        history.go(-info.distance, false)
        // unrecognized error, transfer to the global handler
        return triggerError(error)
      }
    }

    failure =
      failure ||
      finalizeNavigation(
        // after navigation, all matched components are resolved
        toLocation as RouteLocationNormalizedLoaded,
        from,
        false
      )

    // revert the navigation
    if (failure) history.go(-info.distance, false)

    triggerAfterEach(toLocation as RouteLocationNormalizedLoaded, from, failure)
  })

  // Initialization and Errors

  let readyHandlers = useCallbacks<OnReadyCallback>()
  let errorHandlers = useCallbacks<ErrorHandler>()
  let ready: boolean

  /**
   * Trigger errorHandlers added via onError and throws the error as well
   * @param error - error to throw
   * @param shouldThrow - defaults to false. Pass true rethrow the error
   * @returns the error (unless shouldThrow is true)
   */
  function triggerError(error: any, shouldThrow: boolean = false): void {
    markAsReady(error)
    errorHandlers.list().forEach(handler => handler(error))
    if (shouldThrow) throw error
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

  async function handleScroll(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    scrollPosition?: ScrollToPosition
  ) {
    if (!scrollBehavior) return

    await nextTick()
    const position = await scrollBehavior(to, from, scrollPosition || null)
    position && scrollToPosition(position)
  }

  const router: Router = {
    currentRoute,

    addRoute,
    removeRoute,
    hasRoute,
    getRoutes,

    push,
    replace,
    resolve,

    beforeEach: beforeGuards.add,
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

declare module '@vue/runtime-core' {
  interface ComponentCustomOptions {
    /**
     * Guard called when the router is navigating to the route that is rendering
     * this component from a different route. Differently from `beforeRouteUpdate`
     * and `beforeRouteLeave`, `beforeRouteEnter` does not have access to the
     * component instance through `this` because it triggers before the component
     * is even mounted.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteEnter?: NavigationGuardWithThis<undefined>

    /**
     * Guard called whenever the route that renders this component has changed but
     * it is reused for the new route. This allows you to guard for changes in
     * params, the query or the hash.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteUpdate?: NavigationGuard

    /**
     * Guard called when the router is navigating away from the current route that
     * is rendering this component.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteLeave?: NavigationGuard
  }
}

function applyRouterPlugin(app: App, router: Router) {
  app.component('RouterLink', Link)
  app.component('RouterView', View)

  // TODO: add tests
  app.config.globalProperties.$router = router
  Object.defineProperty(app.config.globalProperties, '$route', {
    get: () => router.currentRoute.value,
  })

  let started = false
  // TODO: can we use something that isn't a mixin? Like adding an onMount hook here
  if (isBrowser) {
    app.mixin({
      beforeCreate() {
        if (!started) {
          // this initial navigation is only necessary on client, on server it doesn't make sense
          // because it will create an extra unnecessary navigation and could lead to problems
          router.push(router.history.location.fullPath).catch(err => {
            if (__DEV__)
              console.error('Unhandled error when starting the router', err)
            else return err
          })
          started = true
        }
      },
    })
  }

  const reactiveRoute = {} as {
    [k in keyof RouteLocationNormalizedLoaded]: ComputedRef<
      RouteLocationNormalizedLoaded[k]
    >
  }
  for (let key in START_LOCATION_NORMALIZED) {
    // @ts-ignore: the key matches
    reactiveRoute[key] = computed(() => router.currentRoute.value[key])
  }

  app.provide(routerKey, router)
  app.provide(routeLocationKey, reactive(reactiveRoute))
  // TODO: merge strats for beforeRoute hooks
}

async function runGuardQueue(guards: Lazy<any>[]): Promise<void> {
  for (const guard of guards) {
    await guard()
  }
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

// TODO: move to utils and test
function isSameRouteLocation(a: RouteLocation, b: RouteLocation): boolean {
  let aLastIndex = a.matched.length - 1
  let bLastIndex = b.matched.length - 1

  return (
    aLastIndex > -1 &&
    aLastIndex === bLastIndex &&
    isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) &&
    isSameLocationObject(a.params, b.params) &&
    isSameLocationObject(a.query, b.query) &&
    a.hash === b.hash
  )
}
