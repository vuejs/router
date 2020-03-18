import {
  RouteLocationNormalized,
  RouteRecord,
  RouteLocation,
  NavigationGuard,
  ListenerRemover,
  PostNavigationGuard,
  START_LOCATION_NORMALIZED,
  Lazy,
  TODO,
  Immutable,
  MatcherLocationNormalized,
  RouteLocationNormalizedResolved,
} from './types'
import { RouterHistory, parseURL, stringifyURL } from './history/common'
import {
  ScrollToPosition,
  ScrollPosition,
  scrollToPosition,
} from './utils/scroll'
import { createRouterMatcher } from './matcher'
import { createRouterError, ErrorTypes, NavigationError } from './errors'
import {
  extractComponentsGuards,
  guardToPromiseFn,
  applyToParams,
  isSameRouteRecord,
  isSameLocationObject,
} from './utils'
import { useCallbacks } from './utils/callbacks'
import { encodeParam, decode } from './utils/encoding'
import {
  normalizeQuery,
  parseQuery as originalParseQuery,
  stringifyQuery as originalStringifyQuery,
} from './utils/query'
import { ref, Ref, markNonReactive, nextTick, App, warn } from 'vue'
import { RouteRecordNormalized } from './matcher/types'
import { Link } from './components/Link'
import { View } from './components/View'

type ErrorHandler = (error: any) => any
// resolve, reject arguments of Promise constructor
type OnReadyCallback = [() => void, (reason?: any) => void]

interface ScrollBehavior {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedResolved,
    savedPosition: ScrollToPosition | null
  ): ScrollPosition | Promise<ScrollPosition>
}

export interface RouterOptions {
  history: RouterHistory
  routes: RouteRecord[]
  scrollBehavior?: ScrollBehavior
  parseQuery?: typeof originalParseQuery
  stringifyQuery?: typeof originalStringifyQuery
  // TODO: allow customizing encoding functions
}

export interface Router {
  history: RouterHistory
  currentRoute: Ref<Immutable<RouteLocationNormalizedResolved>>

  addRoute(parentName: string, route: RouteRecord): () => void
  addRoute(route: RouteRecord): () => void
  removeRoute(name: string): void
  getRoutes(): RouteRecordNormalized[]

  resolve(to: RouteLocation): RouteLocationNormalized
  createHref(to: RouteLocationNormalized): string
  push(to: RouteLocation): Promise<RouteLocationNormalizedResolved>
  replace(to: RouteLocation): Promise<RouteLocationNormalizedResolved>

  beforeEach(guard: NavigationGuard<undefined>): ListenerRemover
  afterEach(guard: PostNavigationGuard): ListenerRemover

  onError(handler: ErrorHandler): ListenerRemover
  isReady(): Promise<void>

  install(app: App): void
}

const isClient = typeof window !== 'undefined'

export function createRouter({
  history,
  routes,
  scrollBehavior,
  parseQuery = originalParseQuery,
  stringifyQuery = originalStringifyQuery,
}: RouterOptions): Router {
  const matcher = createRouterMatcher(routes, {})

  const beforeGuards = useCallbacks<NavigationGuard<undefined>>()
  const afterGuards = useCallbacks<PostNavigationGuard>()
  const currentRoute = ref<RouteLocationNormalizedResolved>(
    START_LOCATION_NORMALIZED
  )
  let pendingLocation: Immutable<RouteLocationNormalized> = START_LOCATION_NORMALIZED

  if (isClient && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  function createHref(to: RouteLocationNormalized): string {
    return history.base + to.fullPath
  }

  const encodeParams = applyToParams.bind(null, encodeParam)
  const decodeParams = applyToParams.bind(null, decode)

  function addRoute(parentOrRoute: string | RouteRecord, route?: RouteRecord) {
    let parent: Parameters<typeof matcher['addRoute']>[1] | undefined
    let record: RouteRecord
    if (typeof parentOrRoute === 'string') {
      parent = matcher.getRecordMatcher(parentOrRoute)
      record = route!
    } else {
      record = parentOrRoute
    }

    return matcher.addRoute(record, parent)
  }

  function removeRoute(name: string) {
    let recordMatcher = matcher.getRecordMatcher(name)
    if (recordMatcher) {
      matcher.removeRoute(recordMatcher)
    } else if (__DEV__) {
      // TODO: adapt if we allow Symbol as a name
      warn(`Cannot remove non-existant route "${name}"`)
    }
  }

  function getRoutes(): RouteRecordNormalized[] {
    return matcher.getRoutes().map(routeMatcher => routeMatcher.record)
  }

  function resolve(
    location: RouteLocation,
    currentLocation?: RouteLocationNormalizedResolved
  ): RouteLocationNormalized {
    // const objectLocation = routerLocationAsObject(location)
    currentLocation = currentLocation || currentRoute.value
    if (typeof location === 'string') {
      let locationNormalized = parseURL(parseQuery, location)
      let matchedRoute = matcher.resolve(
        { path: locationNormalized.path },
        currentLocation
      )

      return {
        ...locationNormalized,
        ...matchedRoute,
        params: decodeParams(matchedRoute.params),
        redirectedFrom: undefined,
      }
    }

    let matchedRoute: MatcherLocationNormalized = // relative or named location, path is ignored
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

    return {
      fullPath: stringifyURL(stringifyQuery, {
        ...location,
        path: matchedRoute.path,
      }),
      hash: location.hash || '',
      query: normalizeQuery(location.query),
      ...matchedRoute,
      redirectedFrom: undefined,
    }
  }

  function push(
    to: RouteLocation | RouteLocationNormalized
  ): Promise<RouteLocationNormalizedResolved> {
    return pushWithRedirect(to, undefined)
  }

  async function pushWithRedirect(
    to: RouteLocation | RouteLocationNormalized,
    redirectedFrom: RouteLocationNormalized | undefined
  ): Promise<RouteLocationNormalizedResolved> {
    const toLocation: RouteLocationNormalized = (pendingLocation =
      // Some functions will pass a normalized location and we don't need to resolve it again
      typeof to === 'object' && 'matched' in to ? to : resolve(to))
    const from: RouteLocationNormalizedResolved = currentRoute.value
    // @ts-ignore: no need to check the string as force do not exist on a string
    const force: boolean | undefined = to.force

    // TODO: should we throw an error as the navigation was aborted
    if (!force && isSameRouteLocation(from, toLocation)) return from

    toLocation.redirectedFrom = redirectedFrom

    // trigger all guards, throw if navigation is rejected
    try {
      await navigate(toLocation, from)
    } catch (error) {
      // push was called while waiting in guards
      // TODO: write tests
      if (pendingLocation !== toLocation) {
        triggerError(
          createRouterError<NavigationError>(ErrorTypes.NAVIGATION_CANCELLED, {
            from,
            to: toLocation,
          })
        )
      }

      if (error.type === ErrorTypes.NAVIGATION_GUARD_REDIRECT) {
        // preserve the original redirectedFrom if any
        return pushWithRedirect(error.to, redirectedFrom || toLocation)
      }

      // unkwnown error
      triggerError(error)
    }

    finalizeNavigation(
      toLocation as RouteLocationNormalizedResolved,
      from,
      true,
      // RouteLocationNormalized will give undefined
      (to as RouteLocation).replace === true
    )

    return currentRoute.value
  }

  function replace(to: RouteLocation | RouteLocationNormalized) {
    const location = typeof to === 'string' ? { path: to } : to
    return push({ ...location, replace: true })
  }

  async function navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedResolved
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

      // free the references
      record.instances = {}
    }

    // run the queue of per route beforeRouteLeave guards
    await runGuardQueue(guards)

    // check global guards beforeEach
    guards = []
    for (const guard of beforeGuards.list()) {
      guards.push(guardToPromiseFn(guard, to, from))
    }

    // console.log('Guarding against', guards.length, 'guards')
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
      // the type does'nt matter as we are comparing an object per reference
      to.matched.filter(record => from.matched.indexOf(record as any) < 0),
      'beforeRouteEnter',
      to,
      from
    )

    // run the queue of per route beforeEnter guards
    await runGuardQueue(guards)
  }

  /**
   * - Cleans up any navigation guards
   * - Changes the url if necessary
   * - Calls the scrollBehavior
   */
  function finalizeNavigation(
    toLocation: RouteLocationNormalizedResolved,
    from: RouteLocationNormalizedResolved,
    isPush: boolean,
    replace?: boolean
  ) {
    // a more recent navigation took place
    if (pendingLocation !== toLocation) {
      return triggerError(
        createRouterError<NavigationError>(ErrorTypes.NAVIGATION_CANCELLED, {
          from,
          to: toLocation,
        }),
        isPush
      )
    }

    // remove registered guards from removed matched records
    const [leavingRecords] = extractChangingRecords(toLocation, from)
    for (const record of leavingRecords) {
      record.leaveGuards = []
    }

    // only consider as push if it's not the first navigation
    const isFirstNavigation = from === START_LOCATION_NORMALIZED

    // change URL only if the user did a push/replace and if it's not the initial navigation because
    // it's just reflecting the url
    if (isPush) {
      if (replace || isFirstNavigation) history.replace(toLocation)
      else history.push(toLocation)
    }

    // accept current navigation
    currentRoute.value = markNonReactive(toLocation)
    // TODO: this doesn't work on first load. Moving it to RouterView could allow automatically handling transitions too maybe
    // TODO: refactor with a state getter
    const state = isPush || !isClient ? {} : window.history.state
    handleScroll(toLocation, from, state && state.scroll).catch(err =>
      triggerError(err, false)
    )

    // navigation is confirmed, call afterGuards
    for (const guard of afterGuards.list()) guard(toLocation, from)

    markAsReady()
  }

  // attach listener to history to trigger navigations
  history.listen(async (to, _from, info) => {
    // TODO: try catch to correctly log the matcher error
    const toLocation = resolve(to.fullPath)
    // console.log({ to, matchedRoute })

    pendingLocation = toLocation
    const from = currentRoute.value

    try {
      await navigate(toLocation, from)
      finalizeNavigation(
        // after navigation, all matched components are resolved
        toLocation as RouteLocationNormalizedResolved,
        from,
        false
      )
    } catch (error) {
      if (error.type === ErrorTypes.NAVIGATION_GUARD_REDIRECT) {
        // TODO: refactor the duplication of new NavigationCancelled by
        // checking instanceof NavigationError (it's another TODO)
        // a more recent navigation took place
        if (pendingLocation !== toLocation) {
          return triggerError(
            createRouterError<NavigationError>(
              ErrorTypes.NAVIGATION_CANCELLED,
              {
                from,
                to: toLocation,
              }
            ),
            false
          )
        }
        triggerError(error, false)

        // the error is already handled by router.push
        // we just want to avoid logging the error
        pushWithRedirect(error.to, toLocation).catch(() => {})
      } else if (error.type === ErrorTypes.NAVIGATION_ABORTED) {
        console.log('Cancelled, going to', -info.distance)
        // TODO: test on different browsers ensure consistent behavior
        history.go(-info.distance, false)
      } else {
        triggerError(error, false)
      }
    }
  })

  // Initialization and Errors

  let readyHandlers = useCallbacks<OnReadyCallback>()
  let errorHandlers = useCallbacks<ErrorHandler>()
  let ready: boolean

  /**
   * Trigger errorHandlers added via onError and throws the error as well
   * @param error error to throw
   * @param shouldThrow defaults to true. Pass false to not throw the error
   */
  function triggerError(error: any, shouldThrow: boolean = true): void {
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
   * @param err optional error
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
    to: RouteLocationNormalizedResolved,
    from: RouteLocationNormalizedResolved,
    scrollPosition?: ScrollToPosition
  ) {
    if (!scrollBehavior) return

    await nextTick()
    const position = await scrollBehavior(to, from, scrollPosition || null)
    console.log('scrolling to', position)
    scrollToPosition(position)
  }

  const router: Router = {
    currentRoute,

    addRoute,
    removeRoute,
    getRoutes,

    push,
    replace,
    resolve,

    beforeEach: beforeGuards.add,
    afterEach: afterGuards.add,
    createHref,

    onError: errorHandlers.add,
    isReady,

    history,
    install(app: App) {
      applyRouterPlugin(app, this)
    },
  }

  return router
}

function applyRouterPlugin(app: App, router: Router) {
  // TODO: remove as any
  app.component('RouterLink', Link as any)
  app.component('RouterView', View as any)

  let started = false
  // TODO: can we use something that isn't a mixin?
  // TODO: this initial navigation is only necessary on client, on server it doesn't make sense
  // because it will create an extra unecessary navigation and could lead to problems
  if (isClient)
    app.mixin({
      beforeCreate() {
        if (!started) {
          router.push(router.history.location.fullPath).catch(err => {
            console.error('Unhandled error', err)
          })
          started = true
        }
      },
    })

  // TODO: merge strats?
  app.provide('router', router)
  app.provide('route', router.currentRoute)
}

async function runGuardQueue(guards: Lazy<any>[]): Promise<void> {
  for (const guard of guards) {
    await guard()
  }
}

function extractChangingRecords(
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedResolved
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

// function isSameLocation(
//   a: Immutable<RouteLocationNormalized>,
//   b: Immutable<RouteLocationNormalized>
// ): boolean {
//   return (
//     a.name === b.name &&
//     a.path === b.path &&
//     a.hash === b.hash &&
//     isSameLocationObject(a.query, b.query) &&
//     a.matched.length === b.matched.length &&
//     a.matched.every((record, i) => isSameRouteRecord(record, b.matched[i]))
//   )
// }

function isSameRouteLocation(
  a: RouteLocationNormalized,
  b: RouteLocationNormalized
): boolean {
  let aLastIndex = a.matched.length - 1
  let bLastIndex = b.matched.length - 1

  return (
    aLastIndex > -1 &&
    aLastIndex === bLastIndex &&
    isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) &&
    isSameLocationObject(a.params, b.params)
  )
}
