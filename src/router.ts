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
  START,
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
import { encodeParam } from './utils/encoding'
import { decode } from './utils/encoding'
import { ref, Ref } from '@vue/reactivity'

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
  currentRoute: Ref<RouteLocationNormalized>

  resolve(to: RouteLocation): RouteLocationNormalized
  createHref(to: RouteLocationNormalized): string
  push(to: RouteLocation): Promise<RouteLocationNormalized>
  replace(to: RouteLocation): Promise<RouteLocationNormalized>

  // TODO: find a way to remove it
  doInitialNavigation(): Promise<void>
  setActiveApp(vm: TODO): void

  beforeEach(guard: NavigationGuard): ListenerRemover
  afterEach(guard: PostNavigationGuard): ListenerRemover

  // TODO: also return a ListenerRemover
  onError(handler: ErrorHandler): void
  isReady(): Promise<void>
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
  const beforeGuards: NavigationGuard[] = []
  const afterGuards: PostNavigationGuard[] = []
  const currentRoute = ref<RouteLocationNormalized>(START_LOCATION_NORMALIZED)
  let pendingLocation: Readonly<RouteLocationNormalized> = START_LOCATION_NORMALIZED
  let onReadyCbs: OnReadyCallback[] = []
  // TODO: should these be triggered before or after route.push().catch()
  let errorHandlers: ErrorHandler[] = []
  let app: TODO
  let ready: boolean = false

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

        // TODO: should we allow partial redirects? I think we should because it's impredictable if
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

    const toLocation: RouteLocationNormalized = location
    pendingLocation = toLocation
    // trigger all guards, throw if navigation is rejected
    try {
      await navigate(toLocation, currentRoute.value)
    } catch (error) {
      if (NavigationGuardRedirect.is(error)) {
        // push was called while waiting in guards
        if (pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, currentRoute.value)
        }
        // TODO: setup redirect stack
        // TODO: shouldn't we trigger the error as well
        return push(error.to)
      } else {
        // TODO: write tests
        // triggerError as well
        if (pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, currentRoute.value)
        }

        triggerError(error)
      }
    }

    // push was called while waiting in guards
    if (pendingLocation !== toLocation) {
      throw new NavigationCancelled(toLocation, currentRoute.value)
    }

    // change URL
    if (to.replace === true) history.replace(url)
    else history.push(url)

    const from = currentRoute.value
    currentRoute.value = toLocation
    updateReactiveRoute()
    handleScroll(toLocation, from).catch(err => triggerError(err, false))

    // navigation is confirmed, call afterGuards
    for (const guard of afterGuards) guard(toLocation, from)

    return currentRoute.value
  }

  function replace(to: RouteLocation) {
    const location = typeof to === 'string' ? { path: to } : to
    return push({ ...location, replace: true })
  }

  async function runGuardQueue(guards: Lazy<any>[]): Promise<void> {
    for (const guard of guards) {
      await guard()
    }
  }

  async function navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<TODO> {
    let guards: Lazy<any>[]

    // all components here have been resolved once because we are leaving
    guards = await extractComponentsGuards(
      from.matched.filter(record => to.matched.indexOf(record) < 0).reverse(),
      'beforeRouteLeave',
      to,
      from
    )

    // run the queue of per route beforeRouteLeave guards
    await runGuardQueue(guards)

    // check global guards beforeEach
    guards = []
    for (const guard of beforeGuards) {
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

  history.listen(async (to, from, info) => {
    const matchedRoute = resolveLocation(to, currentRoute.value)
    // console.log({ to, matchedRoute })

    const toLocation: RouteLocationNormalized = { ...to, ...matchedRoute }
    pendingLocation = toLocation

    try {
      await navigate(toLocation, currentRoute.value)

      // a more recent navigation took place
      if (pendingLocation !== toLocation) {
        return triggerError(
          new NavigationCancelled(toLocation, currentRoute.value),
          false
        )
      }

      // accept current navigation
      currentRoute.value = {
        ...to,
        ...matchedRoute,
      }
      updateReactiveRoute()
      // TODO: refactor with a state getter
      // const { scroll } = history.state
      const { state } = window.history
      handleScroll(toLocation, currentRoute.value, state.scroll).catch(err =>
        triggerError(err, false)
      )
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
        history.go(-info.distance, false)
        // TODO: test on different browsers ensure consistent behavior
        // Maybe we could write the length the first time we do a navigation and use that for direction
        // TODO: this doesn't work if the user directly calls window.history.go(-n) with n > 1
        // We can override the go method to retrieve the number but not sure if all browsers allow that
        // if (info.direction === NavigationDirection.back) {
        //   history.forward(false)
        // } else {
        // TODO: go back because we cancelled, then
        // or replace and not discard the rest of history. Check issues, there was one talking about this
        // behaviour, maybe we can do better
        // history.back(false)
        // }
      } else {
        triggerError(error, false)
      }
    }
  })

  function beforeEach(guard: NavigationGuard): ListenerRemover {
    beforeGuards.push(guard)
    return () => {
      const i = beforeGuards.indexOf(guard)
      if (i > -1) beforeGuards.splice(i, 1)
    }
  }

  function afterEach(guard: PostNavigationGuard): ListenerRemover {
    afterGuards.push(guard)
    return () => {
      const i = afterGuards.indexOf(guard)
      if (i > -1) afterGuards.splice(i, 1)
    }
  }

  function onError(handler: ErrorHandler): void {
    errorHandlers.push(handler)
  }

  function triggerError(error: any, shouldThrow: boolean = true): void {
    for (const handler of errorHandlers) {
      handler(error)
    }
    if (shouldThrow) throw error
  }

  function updateReactiveRoute() {
    if (!app) return
    // TODO: matched should be non enumerable and the defineProperty here shouldn't be necessary
    const route = { ...currentRoute.value }
    Object.defineProperty(route, 'matched', { enumerable: false })
    // @ts-ignore
    app._route = Object.freeze(route)
    markAsReady()
  }

  function isReady(): Promise<void> {
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
      return Promise.resolve()
    return new Promise((resolve, reject) => {
      onReadyCbs.push([resolve, reject])
    })
  }

  function markAsReady(err?: any): void {
    if (ready || currentRoute.value === START_LOCATION_NORMALIZED) return
    ready = true
    for (const [resolve] of onReadyCbs) {
      // TODO: is this okay?
      // always resolve, as the router is ready even if there was an error
      // @ts-ignore
      resolve(err)
      // TODO: try catch the on ready?
      // if (err) reject(err)
      // else resolve()
    }
    onReadyCbs = []
  }

  async function doInitialNavigation(): Promise<void> {
    // let the user call replace or push on SSR
    if (history.location === START) return
    // TODO: refactor code that was duplicated from push method
    const toLocation: RouteLocationNormalized = resolveLocation(
      history.location,
      currentRoute.value
    )

    pendingLocation = toLocation
    // trigger all guards, throw if navigation is rejected
    try {
      await navigate(toLocation, currentRoute.value)
    } catch (error) {
      markAsReady(error)
      if (NavigationGuardRedirect.is(error)) {
        // push was called while waiting in guards
        if (pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, currentRoute.value)
        }
        // TODO: setup redirect stack
        await push(error.to)
        return
      } else {
        // TODO: write tests
        // triggerError as well
        if (pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, currentRoute.value)
        }

        // this throws, so nothing ahead happens
        triggerError(error)
      }
    }

    // push was called while waiting in guards
    if (pendingLocation !== toLocation) {
      const error = new NavigationCancelled(toLocation, currentRoute.value)
      markAsReady(error)
      throw error
    }

    // NOTE: here we removed the pushing to history part as the history
    // already contains current location

    const from = currentRoute.value
    currentRoute.value = toLocation
    updateReactiveRoute()

    // navigation is confirmed, call afterGuards
    for (const guard of afterGuards) guard(toLocation, from)

    markAsReady()
  }

  async function handleScroll(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    scrollPosition?: ScrollToPosition
  ) {
    if (!scrollBehavior) return

    await app.$nextTick()
    const position = await scrollBehavior(to, from, scrollPosition || null)
    console.log('scrolling to', position)
    scrollToPosition(position)
  }

  function setActiveApp(vm: TODO) {
    app = vm
    updateReactiveRoute()
  }

  const router: Router = {
    currentRoute,
    push,
    replace,
    resolve,
    beforeEach,
    afterEach,
    createHref,
    onError,
    isReady,

    doInitialNavigation,
    setActiveApp,
  }

  return router
}
