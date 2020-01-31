import {
  RouteLocationNormalized,
  RouteRecord,
  RouteLocation,
  NavigationGuard,
  ListenerRemover,
  PostNavigationGuard,
  START_LOCATION_NORMALIZED,
  MatcherLocation,
  RouteQueryAndHash,
  Lazy,
  TODO,
} from './types'
import {
  RouterHistory,
  normalizeLocation,
  stringifyURL,
  normalizeQuery,
  HistoryLocationNormalized,
} from './history/common'
import {
  ScrollToPosition,
  ScrollPosition,
  scrollToPosition,
} from './utils/scroll'
import { createRouterMatcher } from './matcher'
import {
  NavigationCancelled,
  NavigationGuardRedirect,
  NavigationAborted,
} from './errors'
import { extractComponentsGuards, guardToPromiseFn } from './utils'
import { useCallbacks } from './utils/callbacks'
import { encodeParam } from './utils/encoding'
import { decode } from './utils/encoding'
import { ref, Ref, markNonReactive } from '@vue/reactivity'
import { nextTick } from '@vue/runtime-core'
import { RouteRecordMatched } from './matcher/types'

type ErrorHandler = (error: any) => any
// resolve, reject arguments of Promise constructor
type OnReadyCallback = [() => void, (reason?: any) => void]

interface ScrollBehavior {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    savedPosition: ScrollToPosition | null
  ): ScrollPosition | Promise<ScrollPosition>
}

export interface RouterOptions {
  history: RouterHistory
  routes: RouteRecord[]
  scrollBehavior?: ScrollBehavior
  // TODO: allow customizing encoding functions
}

export interface Router {
  history: RouterHistory
  currentRoute: Ref<RouteLocationNormalized>

  resolve(to: RouteLocation): RouteLocationNormalized
  createHref(to: RouteLocationNormalized): string
  push(to: RouteLocation): Promise<RouteLocationNormalized>
  replace(to: RouteLocation): Promise<RouteLocationNormalized>

  beforeEach(guard: NavigationGuard): ListenerRemover
  afterEach(guard: PostNavigationGuard): ListenerRemover

  // TODO: also return a ListenerRemover
  onError(handler: ErrorHandler): void
  isReady(): Promise<void>
}

const isClient = typeof window !== 'undefined'

async function runGuardQueue(guards: Lazy<any>[]): Promise<void> {
  for (const guard of guards) {
    await guard()
  }
}

function extractChangingRecords(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  const leavingRecords: RouteRecordMatched[] = []
  const updatingRecords: RouteRecordMatched[] = []
  const enteringRecords: RouteRecordMatched[] = []

  // TODO: could be optimized with one single for loop
  for (const record of from.matched) {
    if (to.matched.indexOf(record) < 0) leavingRecords.push(record)
    else updatingRecords.push(record)
  }

  for (const record of to.matched) {
    if (from.matched.indexOf(record) < 0) enteringRecords.push(record)
  }

  return [leavingRecords, updatingRecords, enteringRecords]
}

export function createRouter({
  history,
  routes,
  scrollBehavior,
}: RouterOptions): Router {
  const matcher: ReturnType<typeof createRouterMatcher> = createRouterMatcher(
    routes,
    {},
    encodeParam,
    decode
  )

  const beforeGuards = useCallbacks<NavigationGuard>()
  const afterGuards = useCallbacks<PostNavigationGuard>()
  const currentRoute = ref<RouteLocationNormalized>(START_LOCATION_NORMALIZED)
  let pendingLocation: Readonly<RouteLocationNormalized> = START_LOCATION_NORMALIZED

  if (isClient && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  function resolve(
    to: RouteLocation,
    currentLocation?: RouteLocationNormalized /*, append?: boolean */
  ): RouteLocationNormalized {
    if (typeof to === 'string')
      return resolveLocation(
        // TODO: refactor and remove import
        normalizeLocation(to),
        currentLocation
      )
    return resolveLocation(
      {
        // TODO: refactor with url utils
        query: {},
        hash: '',
        ...to,
      },
      currentLocation
    )
  }

  function createHref(to: RouteLocationNormalized): string {
    return history.base + to.fullPath
  }

  function resolveLocation(
    location: MatcherLocation & Required<RouteQueryAndHash>,
    currentLocation?: RouteLocationNormalized,
    redirectedFrom?: RouteLocationNormalized
    // ensure when returning that the redirectedFrom is a normalized location
  ): RouteLocationNormalized {
    currentLocation = currentLocation || currentRoute.value
    // TODO: still return a normalized location with no matched records if no location is found
    const matchedRoute = matcher.resolve(location, currentLocation)

    if ('redirect' in matchedRoute) {
      const { redirect } = matchedRoute
      // target location normalized, used if we want to redirect again
      const normalizedLocation: RouteLocationNormalized = {
        ...matchedRoute.normalizedLocation,
        fullPath: stringifyURL({
          path: matchedRoute.normalizedLocation.path,
          query: location.query,
          hash: location.hash,
        }),
        query: normalizeQuery(location.query || {}),
        hash: location.hash,
        redirectedFrom,
        meta: {},
      }

      if (typeof redirect === 'string') {
        // match the redirect instead
        return resolveLocation(
          normalizeLocation(redirect),
          currentLocation,
          normalizedLocation
        )
      } else if (typeof redirect === 'function') {
        const newLocation = redirect(normalizedLocation)

        if (typeof newLocation === 'string') {
          return resolveLocation(
            normalizeLocation(newLocation),
            currentLocation,
            normalizedLocation
          )
        }

        // TODO: should we allow partial redirects? I think we should not because it's impredictable if
        // there was a redirect before
        // if (!('path' in newLocation) && !('name' in newLocation)) throw new Error('TODO: redirect canot be relative')

        return resolveLocation(
          {
            ...newLocation,
            query: normalizeQuery(newLocation.query || {}),
            hash: newLocation.hash || '',
          },
          currentLocation,
          normalizedLocation
        )
      } else {
        return resolveLocation(
          {
            ...redirect,
            query: normalizeQuery(redirect.query || {}),
            hash: redirect.hash || '',
          },
          currentLocation,
          normalizedLocation
        )
      }
    } else {
      // add the redirectedFrom field
      const url = normalizeLocation({
        path: matchedRoute.path,
        query: location.query,
        hash: location.hash,
      })
      return {
        ...matchedRoute,
        ...url,
        redirectedFrom,
      }
    }
  }

  async function push(to: RouteLocation): Promise<RouteLocationNormalized> {
    let url: HistoryLocationNormalized
    let location: RouteLocationNormalized
    // TODO: refactor into matchLocation to return location and url
    if (typeof to === 'string' || ('path' in to && !('name' in to))) {
      url = normalizeLocation(to)
      // TODO: should allow a non matching url to allow dynamic routing to work
      location = resolveLocation(url, currentRoute.value)
    } else {
      // named or relative route
      const query = to.query ? normalizeQuery(to.query) : {}
      const hash = to.hash || ''
      // we need to resolve first
      location = resolveLocation({ ...to, query, hash }, currentRoute.value)
      // intentionally drop current query and hash
      url = normalizeLocation({
        query,
        hash,
        ...location,
      })
    }

    // TODO: should we throw an error as the navigation was aborted
    // TODO: needs a proper check because order in query could be different
    if (
      currentRoute.value !== START_LOCATION_NORMALIZED &&
      currentRoute.value.fullPath === url.fullPath
    )
      return currentRoute.value

    const toLocation: RouteLocationNormalized = (pendingLocation = location)
    // trigger all guards, throw if navigation is rejected
    try {
      await navigate(toLocation, currentRoute.value)
    } catch (error) {
      if (NavigationGuardRedirect.is(error)) {
        // push was called while waiting in guards
        if (pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          triggerError(new NavigationCancelled(toLocation, currentRoute.value))
        }
        // TODO: setup redirect stack
        // TODO: shouldn't we trigger the error as well
        return push(error.to)
      } else {
        // TODO: write tests
        // triggerError as well
        if (pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          triggerError(new NavigationCancelled(toLocation, currentRoute.value))
        }
      }
      triggerError(error)
    }

    finalizeNavigation(toLocation, true, to.replace === true)

    return currentRoute.value
  }

  function replace(to: RouteLocation) {
    const location = typeof to === 'string' ? { path: to } : to
    return push({ ...location, replace: true })
  }

  async function navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<TODO> {
    let guards: Lazy<any>[]

    // all components here have been resolved once because we are leaving
    // TODO: refactor both together
    guards = await extractComponentsGuards(
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

    // console.log('Guarding against', guards.length, 'guards')
    await runGuardQueue(guards)

    // check in components beforeRouteUpdate
    guards = await extractComponentsGuards(
      to.matched.filter(record => from.matched.indexOf(record) > -1),
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
      if (record.beforeEnter && from.matched.indexOf(record) < 0) {
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

    // check in-component beforeRouteEnter
    // TODO: is it okay to resolve all matched component or should we do it in order
    guards = await extractComponentsGuards(
      to.matched.filter(record => from.matched.indexOf(record) < 0),
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
    toLocation: RouteLocationNormalized,
    isPush: boolean,
    replace?: boolean
  ) {
    const from = currentRoute.value
    // a more recent navigation took place
    if (pendingLocation !== toLocation) {
      return triggerError(new NavigationCancelled(toLocation, from), isPush)
    }

    // remove registered guards from removed matched records
    const [leavingRecords] = extractChangingRecords(toLocation, from)
    for (const record of leavingRecords) {
      record.leaveGuards = []
    }

    // change URL only if the user did a push/replace
    if (isPush) {
      if (replace) history.replace(toLocation)
      else history.push(toLocation)
    }

    // accept current navigation
    currentRoute.value = markNonReactive(toLocation)
    // TODO: this doesn't work on first load. Moving it to RouterView could allow automatically handling transitions too maybe
    // TODO: refactor with a state getter
    const state = isPush ? {} : window.history.state
    handleScroll(toLocation, from, state && state.scroll).catch(err =>
      triggerError(err, false)
    )

    // navigation is confirmed, call afterGuards
    for (const guard of afterGuards.list()) guard(toLocation, from)

    markAsReady()
  }

  // attach listener to history to trigger navigations
  history.listen(async (to, from, info) => {
    const matchedRoute = resolveLocation(to, currentRoute.value)
    // console.log({ to, matchedRoute })

    const toLocation: RouteLocationNormalized = { ...to, ...matchedRoute }
    pendingLocation = toLocation

    try {
      await navigate(toLocation, currentRoute.value)
      finalizeNavigation(toLocation, false)
    } catch (error) {
      if (NavigationGuardRedirect.is(error)) {
        // TODO: refactor the duplication of new NavigationCancelled by
        // checking instanceof NavigationError (it's another TODO)
        // a more recent navigation took place
        if (pendingLocation !== toLocation) {
          return triggerError(
            new NavigationCancelled(toLocation, currentRoute.value),
            false
          )
        }
        triggerError(error, false)

        // the error is already handled by router.push
        // we just want to avoid logging the error
        push(error.to).catch(() => {})
      } else if (NavigationAborted.is(error)) {
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
  // TODO: should these be triggered before or after route.push().catch()
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
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
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
    push,
    replace,
    resolve,
    beforeEach: beforeGuards.add,
    afterEach: afterGuards.add,
    createHref,
    onError: errorHandlers.add,
    isReady,

    history,
  }

  return router
}
