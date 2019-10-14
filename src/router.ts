import {
  normalizeLocation,
  RouterHistory,
  stringifyURL,
  normalizeQuery,
  HistoryLocationNormalized,
  START,
} from './history/common'
import { RouterMatcher } from './matcher'
import {
  RouteLocation,
  RouteRecord,
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
  ListenerRemover,
  NavigationGuard,
  TODO,
  PostNavigationGuard,
  Lazy,
  MatcherLocation,
  RouteQueryAndHash,
} from './types/index'
import {
  ScrollToPosition,
  ScrollPosition,
  scrollToPosition,
} from './utils/scroll'

import { guardToPromiseFn, extractComponentsGuards } from './utils'
import {
  NavigationGuardRedirect,
  NavigationAborted,
  NavigationCancelled,
} from './errors'

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
}

type ErrorHandler = (error: any) => any

// resolve, reject arguments of Promise constructor
type OnReadyCallback = [() => void, (reason?: any) => void]
export class Router {
  protected history: RouterHistory
  private matcher: RouterMatcher
  private beforeGuards: NavigationGuard[] = []
  private afterGuards: PostNavigationGuard[] = []
  currentRoute: Readonly<RouteLocationNormalized> = START_LOCATION_NORMALIZED
  pendingLocation: Readonly<RouteLocationNormalized> = START_LOCATION_NORMALIZED
  private app: any
  // TODO: should these be triggered before or after route.push().catch()
  private errorHandlers: ErrorHandler[] = []
  private ready: boolean = false
  private onReadyCbs: OnReadyCallback[] = []
  private scrollBehavior?: ScrollBehavior

  constructor(options: RouterOptions) {
    this.history = options.history
    // this.history.ensureLocation()
    this.scrollBehavior = options.scrollBehavior

    this.matcher = new RouterMatcher(options.routes)

    this.history.listen(async (to, from, info) => {
      const matchedRoute = this.resolveLocation(to, this.currentRoute)
      // console.log({ to, matchedRoute })

      const toLocation: RouteLocationNormalized = { ...to, ...matchedRoute }
      this.pendingLocation = toLocation

      try {
        await this.navigate(toLocation, this.currentRoute)

        // a more recent navigation took place
        if (this.pendingLocation !== toLocation) {
          return this.triggerError(
            new NavigationCancelled(toLocation, this.currentRoute),
            false
          )
        }

        // accept current navigation
        this.currentRoute = {
          ...to,
          ...matchedRoute,
        }
        this.updateReactiveRoute()
        // TODO: refactor with a state getter
        // const { scroll } = this.history.state
        const { state } = window.history
        this.handleScroll(toLocation, this.currentRoute, state.scroll).catch(
          err => this.triggerError(err, false)
        )
      } catch (error) {
        if (NavigationGuardRedirect.is(error)) {
          // TODO: refactor the duplication of new NavigationCancelled by
          // checking instanceof NavigationError (it's another TODO)
          // a more recent navigation took place
          if (this.pendingLocation !== toLocation) {
            return this.triggerError(
              new NavigationCancelled(toLocation, this.currentRoute),
              false
            )
          }
          this.triggerError(error, false)

          // the error is already handled by router.push
          // we just want to avoid logging the error
          this.push(error.to).catch(() => {})
        } else if (NavigationAborted.is(error)) {
          console.log('Cancelled, going to', -info.distance)
          this.history.go(-info.distance, false)
          // TODO: test on different browsers ensure consistent behavior
          // Maybe we could write the length the first time we do a navigation and use that for direction
          // TODO: this doesn't work if the user directly calls window.history.go(-n) with n > 1
          // We can override the go method to retrieve the number but not sure if all browsers allow that
          // if (info.direction === NavigationDirection.back) {
          //   this.history.forward(false)
          // } else {
          // TODO: go back because we cancelled, then
          // or replace and not discard the rest of history. Check issues, there was one talking about this
          // behaviour, maybe we can do better
          // this.history.back(false)
          // }
        } else {
          this.triggerError(error, false)
        }
      }
    })
  }

  resolve(
    to: RouteLocation,
    currentLocation?: RouteLocationNormalized /*, append?: boolean */
  ): RouteLocationNormalized {
    if (typeof to === 'string')
      return this.resolveLocation(
        // TODO: refactor and remove import
        normalizeLocation(to),
        currentLocation
      )
    return this.resolveLocation({
      // TODO: refactor with url utils
      query: {},
      hash: '',
      ...to,
    })
  }

  createHref(to: RouteLocationNormalized): string {
    return this.history.base + to.fullPath
  }

  private resolveLocation(
    location: MatcherLocation & Required<RouteQueryAndHash>,
    currentLocation?: RouteLocationNormalized,
    redirectedFrom?: RouteLocationNormalized
    // ensure when returning that the redirectedFrom is a normalized location
  ): RouteLocationNormalized {
    currentLocation = currentLocation || this.currentRoute
    const matchedRoute = this.matcher.resolve(location, currentLocation)

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
        return this.resolveLocation(
          normalizeLocation(redirect),
          currentLocation,
          normalizedLocation
        )
      } else if (typeof redirect === 'function') {
        const newLocation = redirect(normalizedLocation)

        if (typeof newLocation === 'string') {
          return this.resolveLocation(
            normalizeLocation(newLocation),
            currentLocation,
            normalizedLocation
          )
        }

        // TODO: should we allow partial redirects? I think we should because it's impredictable if
        // there was a redirect before
        // if (!('path' in newLocation) && !('name' in newLocation)) throw new Error('TODO: redirect canot be relative')

        return this.resolveLocation(
          {
            ...newLocation,
            query: normalizeQuery(newLocation.query || {}),
            hash: newLocation.hash || '',
          },
          currentLocation,
          normalizedLocation
        )
      } else {
        return this.resolveLocation(
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

  /**
   * Get an array of matched components for a location. TODO: check if the array should contain plain components
   * instead of functions that return promises for lazy loaded components
   * @param to location to geth matched components from. If not provided, uses current location instead
   */
  // getMatchedComponents(
  //   to?: RouteLocation | RouteLocationNormalized
  // ): RouteComponent[] {
  //   const location = to
  //     ? typeof to !== 'string' && 'matched' in to
  //       ? to
  //       : this.resolveLocation(typeof to === 'string' ? this.history.utils.normalizeLocation(to) : to)
  //     : this.currentRoute
  //   if (!location) return []
  //   return location.matched.map(m =>
  //     Object.keys(m.components).map(name => m.components[name])
  //   )
  // }

  /**
   * Trigger a navigation, adding an entry to the history stack. Also apply all navigation
   * guards first
   * @param to where to go
   */
  async push(to: RouteLocation): Promise<RouteLocationNormalized> {
    let url: HistoryLocationNormalized
    let location: RouteLocationNormalized
    // TODO: refactor into matchLocation to return location and url
    if (typeof to === 'string' || ('path' in to && !('name' in to))) {
      url = normalizeLocation(to)
      // TODO: should allow a non matching url to allow dynamic routing to work
      location = this.resolveLocation(url, this.currentRoute)
    } else {
      // named or relative route
      const query = to.query ? normalizeQuery(to.query) : {}
      const hash = to.hash || ''
      // we need to resolve first
      location = this.resolveLocation({ ...to, query, hash }, this.currentRoute)
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
      this.currentRoute !== START_LOCATION_NORMALIZED &&
      this.currentRoute.fullPath === url.fullPath
    )
      return this.currentRoute

    const toLocation: RouteLocationNormalized = location
    this.pendingLocation = toLocation
    // trigger all guards, throw if navigation is rejected
    try {
      await this.navigate(toLocation, this.currentRoute)
    } catch (error) {
      if (NavigationGuardRedirect.is(error)) {
        // push was called while waiting in guards
        if (this.pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, this.currentRoute)
        }
        // TODO: setup redirect stack
        // TODO: shouldn't we trigger the error as well
        return this.push(error.to)
      } else {
        // TODO: write tests
        // triggerError as well
        if (this.pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, this.currentRoute)
        }

        this.triggerError(error)
      }
    }

    // push was called while waiting in guards
    if (this.pendingLocation !== toLocation) {
      throw new NavigationCancelled(toLocation, this.currentRoute)
    }

    // change URL
    if (to.replace === true) this.history.replace(url)
    else this.history.push(url)

    const from = this.currentRoute
    this.currentRoute = toLocation
    this.updateReactiveRoute()
    this.handleScroll(toLocation, from).catch(err =>
      this.triggerError(err, false)
    )

    // navigation is confirmed, call afterGuards
    for (const guard of this.afterGuards) guard(toLocation, from)

    return this.currentRoute
  }

  /**
   * Trigger a navigation, replacing current entry in history. Also apply all navigation
   * guards first
   * @param to where to go
   */
  replace(to: RouteLocation) {
    const location = typeof to === 'string' ? { path: to } : to
    return this.push({ ...location, replace: true })
  }

  /**
   * Runs a guard queue and handles redirects, rejections
   * @param guards Array of guards converted to functions that return a promise
   * @returns {boolean} true if the navigation should be cancelled false otherwise
   */
  private async runGuardQueue(guards: Lazy<any>[]): Promise<void> {
    for (const guard of guards) {
      await guard()
    }
  }

  private async navigate(
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
    await this.runGuardQueue(guards)

    // check global guards beforeEach
    guards = []
    for (const guard of this.beforeGuards) {
      guards.push(guardToPromiseFn(guard, to, from))
    }

    // console.log('Guarding against', guards.length, 'guards')
    await this.runGuardQueue(guards)

    // check in components beforeRouteUpdate
    guards = await extractComponentsGuards(
      to.matched.filter(record => from.matched.indexOf(record) > -1),
      'beforeRouteUpdate',
      to,
      from
    )

    // run the queue of per route beforeEnter guards
    await this.runGuardQueue(guards)

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
    await this.runGuardQueue(guards)

    // check in-component beforeRouteEnter
    // TODO: is it okay to resolve all matched component or should we do it in order
    guards = await extractComponentsGuards(
      to.matched.filter(record => from.matched.indexOf(record) < 0),
      'beforeRouteEnter',
      to,
      from
    )

    // run the queue of per route beforeEnter guards
    await this.runGuardQueue(guards)
  }

  /**
   * Add a global beforeGuard that can confirm, abort or modify a navigation
   * @param guard
   */
  beforeEach(guard: NavigationGuard): ListenerRemover {
    this.beforeGuards.push(guard)
    return () => {
      const i = this.beforeGuards.indexOf(guard)
      if (i > -1) this.beforeGuards.splice(i, 1)
    }
  }

  /**
   * Add a global after guard that is called once the navigation is confirmed
   * @param guard
   */
  afterEach(guard: PostNavigationGuard): ListenerRemover {
    this.afterGuards.push(guard)
    return () => {
      const i = this.afterGuards.indexOf(guard)
      if (i > -1) this.afterGuards.splice(i, 1)
    }
  }

  /**
   * Add an error handler to catch errors during navigation
   * TODO: return a remover like beforeEach
   * @param handler error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler)
  }

  /**
   * Trigger all registered error handlers
   * @param error thrown error
   * @param shouldThrow set to false to not throw the error
   */
  private triggerError(error: any, shouldThrow: boolean = true): void {
    for (const handler of this.errorHandlers) {
      handler(error)
    }
    if (shouldThrow) throw error
  }

  private updateReactiveRoute() {
    if (!this.app) return
    // TODO: matched should be non enumerable and the defineProperty here shouldn't be necessary
    const route = { ...this.currentRoute }
    Object.defineProperty(route, 'matched', { enumerable: false })
    this.app._route = Object.freeze(route)
    this.markAsReady()
  }

  /**
   * Returns a Promise that resolves once the router is ready to be used for navigation
   * Eg: Calling router.push() or router.replace(). This is necessary because we have to
   * wait for the Vue root instance to be created
   */
  onReady(): Promise<void> {
    if (this.ready) return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.onReadyCbs.push([resolve, reject])
    })
  }

  /**
   * Mark the router as ready. This function is used internally and should not be called
   * by the developper. You can optionally provide an error.
   * This will trigger all onReady callbacks and empty the array
   * @param err optional error if navigation failed
   */
  protected markAsReady(err?: any): void {
    if (this.ready) return
    for (const [resolve] of this.onReadyCbs) {
      // TODO: is this okay?
      // always resolve, as the router is ready even if there was an error
      // @ts-ignore
      resolve(err)
      // if (err) reject(err)
      // else resolve()
    }
    this.onReadyCbs = []
    this.ready = true
  }

  // TODO: rename to ensureInitialLocation
  async doInitialNavigation(): Promise<void> {
    // let the user call replace or push on SSR
    if (this.history.location === START) return
    // TODO: refactor code that was duplicated from push method
    const toLocation: RouteLocationNormalized = this.resolveLocation(
      this.history.location,
      this.currentRoute
    )

    this.pendingLocation = toLocation
    // trigger all guards, throw if navigation is rejected
    try {
      await this.navigate(toLocation, this.currentRoute)
    } catch (error) {
      this.markAsReady(error)
      if (NavigationGuardRedirect.is(error)) {
        // push was called while waiting in guards
        if (this.pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, this.currentRoute)
        }
        // TODO: setup redirect stack
        await this.push(error.to)
        return
      } else {
        // TODO: write tests
        // triggerError as well
        if (this.pendingLocation !== toLocation) {
          // TODO: trigger onError as well
          throw new NavigationCancelled(toLocation, this.currentRoute)
        }

        // this throws, so nothing ahead happens
        this.triggerError(error)
      }
    }

    // push was called while waiting in guards
    if (this.pendingLocation !== toLocation) {
      const error = new NavigationCancelled(toLocation, this.currentRoute)
      this.markAsReady(error)
      throw error
    }

    // NOTE: here we removed the pushing to history part as the history
    // already contains current location

    const from = this.currentRoute
    this.currentRoute = toLocation
    this.updateReactiveRoute()

    // navigation is confirmed, call afterGuards
    for (const guard of this.afterGuards) guard(toLocation, from)

    this.markAsReady()
  }

  private async handleScroll(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    scrollPosition?: ScrollToPosition
  ) {
    if (!this.scrollBehavior) return

    await this.app.$nextTick()
    const position = await this.scrollBehavior(to, from, scrollPosition || null)
    console.log('scrolling to', position)
    scrollToPosition(position)
  }
}
