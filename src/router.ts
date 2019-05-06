import { BaseHistory, HistoryLocationNormalized } from './history/base'
import { RouterMatcher } from './matcher'
import {
  RouteLocation,
  RouteRecord,
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
  MatcherLocationNormalized,
  ListenerRemover,
  NavigationGuard,
  TODO,
  PostNavigationGuard,
  Lazy,
  MatcherLocation,
} from './types/index'

import { guardToPromiseFn, extractComponentsGuards } from './utils'
import { RedirectError } from './errors'

export interface RouterOptions {
  history: BaseHistory
  routes: RouteRecord[]
}

export class Router {
  protected history: BaseHistory
  private matcher: RouterMatcher
  private beforeGuards: NavigationGuard[] = []
  private afterGuards: PostNavigationGuard[] = []
  currentRoute: Readonly<RouteLocationNormalized> = START_LOCATION_NORMALIZED

  constructor(options: RouterOptions) {
    this.history = options.history
    // this.history.ensureLocation()

    this.matcher = new RouterMatcher(options.routes)

    this.history.listen((to, from, info) => {
      // TODO: check navigation guards
      const matchedRoute = this.matchLocation(to, this.currentRoute)
      // console.log({ to, matchedRoute })
      // TODO: navigate

      this.currentRoute = {
        ...to,
        ...matchedRoute,
      }
    })
  }

  private matchLocation(
    location: MatcherLocation,
    currentLocation: MatcherLocationNormalized
  ): MatcherLocationNormalized {
    const matchedRoute = this.matcher.resolve(location, currentLocation)
    if ('redirect' in matchedRoute) {
      const { redirect, normalizedLocation } = matchedRoute
      // TODO: add from to a redirect stack?
      if (typeof redirect === 'string') {
        // match the redirect instead
        return this.matchLocation(
          this.history.utils.normalizeLocation(redirect),
          currentLocation
        )
      } else if (typeof redirect === 'function') {
        const url = this.history.utils.normalizeLocation(normalizedLocation)
        const newLocation = redirect({
          ...normalizedLocation,
          ...url,
        })

        if (typeof newLocation === 'string') {
          return this.matchLocation(
            this.history.utils.normalizeLocation(newLocation),
            currentLocation
          )
        }

        return this.matchLocation(newLocation, currentLocation)
      } else {
        return this.matchLocation(redirect, currentLocation)
      }
    } else {
      return matchedRoute
    }
  }

  /**
   * Trigger a navigation, adding an entry to the history stack. Also apply all navigation
   * guards first
   * @param to where to go
   */
  async push(to: RouteLocation): Promise<RouteLocationNormalized> {
    let url: HistoryLocationNormalized
    let location: MatcherLocationNormalized
    if (typeof to === 'string' || 'path' in to) {
      url = this.history.utils.normalizeLocation(to)
      // TODO: should allow a non matching url to allow dynamic routing to work
      location = this.matchLocation(url, this.currentRoute)
    } else {
      // named or relative route
      // we need to resolve first
      location = this.matchLocation(to, this.currentRoute)
      // intentionally drop current query and hash
      url = this.history.utils.normalizeLocation({
        query: to.query ? this.history.utils.normalizeQuery(to.query) : {},
        hash: to.hash,
        ...location,
      })
    }

    // TODO: should we throw an error as the navigation was aborted
    if (this.currentRoute.fullPath === url.fullPath) return this.currentRoute

    const toLocation: RouteLocationNormalized = { ...url, ...location }
    // trigger all guards, throw if navigation is rejected
    try {
      await this.navigate(toLocation, this.currentRoute)
    } catch (error) {
      if (error instanceof RedirectError) {
        // TODO: setup redirect stack
        return this.push(error.to)
      } else {
        throw error
      }
    }

    // change URL
    if (to.replace === true) this.history.replace(url)
    else this.history.push(url)

    const from = this.currentRoute
    this.currentRoute = toLocation

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
    // TODO: Will probably need to be some kind of queue in the future that allows to remove
    // elements and other stuff
    let guards: Lazy<any>[]

    // TODO: is it okay to resolve all matched component or should we do it in order
    guards = await extractComponentsGuards(
      from.matched.filter(record => to.matched.indexOf(record) < 0).reverse(),
      'beforeRouteLeave',
      to,
      from
    )

    // run the queue of per route beforeEnter guards
    await this.runGuardQueue(guards)

    // check global guards beforeEach
    // avoid if we are not changing route
    // TODO: trigger on child navigation
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
    // TODO: check children. Should we also check reused routes guards
    guards = []
    for (const record of to.matched) {
      // do not trigger beforeEnter on reused views
      if (record.beforeEnter && from.matched.indexOf(record) < 0)
        guards.push(guardToPromiseFn(record.beforeEnter, to, from))
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
      this.beforeGuards.splice(this.beforeGuards.indexOf(guard), 1)
    }
  }

  /**
   * Add a global after guard that is called once the navigation is confirmed
   * @param guard
   */
  afterEach(guard: PostNavigationGuard): ListenerRemover {
    this.afterGuards.push(guard)
    return () => {
      this.afterGuards.splice(this.afterGuards.indexOf(guard), 1)
    }
  }
}
