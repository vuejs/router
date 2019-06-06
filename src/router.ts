import {
  BaseHistory,
  HistoryLocationNormalized,
  NavigationDirection,
} from './history/base'
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

import { guardToPromiseFn, extractComponentsGuards } from './utils'
import { NavigationGuardRedirect } from './errors'

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
  private app: any

  constructor(options: RouterOptions) {
    this.history = options.history
    // this.history.ensureLocation()

    this.matcher = new RouterMatcher(options.routes)

    this.history.listen(async (to, from, info) => {
      const matchedRoute = this.matchLocation(to, this.currentRoute)
      // console.log({ to, matchedRoute })

      const toLocation: RouteLocationNormalized = { ...to, ...matchedRoute }

      try {
        await this.navigate(toLocation, this.currentRoute)

        // accept current navigation
        this.currentRoute = {
          ...to,
          ...matchedRoute,
        }
        this.updateReactiveRoute()
      } catch (error) {
        // TODO: use the push/replace technique with any navigation to
        // preserve history when moving forward
        if (error instanceof NavigationGuardRedirect) {
          this.push(error.to)
        } else {
          // TODO: handle abort and redirect correctly
          // if we were going back, we push and discard the rest of the history
          if (info.direction === NavigationDirection.back) {
            this.history.push(from)
          } else {
            // TODO: go back because we cancelled, then
            // or replace and not discard the rest of history. Check issues, there was one talking about this
            // behaviour, maybe we can do better
            this.history.back(false)
          }
        }
      }
    })
  }

  // TODO: rename to resolveLocation?
  private matchLocation(
    location: MatcherLocation & Required<RouteQueryAndHash>,
    currentLocation: RouteLocationNormalized,
    redirectedFrom?: RouteLocationNormalized
    // ensure when returning that the redirectedFrom is a normalized location
  ): RouteLocationNormalized {
    const matchedRoute = this.matcher.resolve(location, currentLocation)

    if ('redirect' in matchedRoute) {
      const { redirect } = matchedRoute
      // target location normalized, used if we want to redirect again
      const normalizedLocation: RouteLocationNormalized = {
        ...matchedRoute.normalizedLocation,
        fullPath: this.history.utils.stringifyURL({
          path: matchedRoute.normalizedLocation.path,
          query: location.query,
          hash: location.hash,
        }),
        query: this.history.utils.normalizeQuery(location.query || {}),
        hash: location.hash,
        redirectedFrom,
      }

      if (typeof redirect === 'string') {
        // match the redirect instead
        return this.matchLocation(
          this.history.utils.normalizeLocation(redirect),
          currentLocation,
          normalizedLocation
        )
      } else if (typeof redirect === 'function') {
        const newLocation = redirect(normalizedLocation)

        if (typeof newLocation === 'string') {
          return this.matchLocation(
            this.history.utils.normalizeLocation(newLocation),
            currentLocation,
            normalizedLocation
          )
        }

        // TODO: should we allow partial redirects? I think we should because it's impredictable if
        // there was a redirect before
        // if (!('path' in newLocation) && !('name' in newLocation)) throw new Error('TODO: redirect canot be relative')

        return this.matchLocation(
          {
            ...newLocation,
            query: this.history.utils.normalizeQuery(newLocation.query || {}),
            hash: newLocation.hash || '',
          },
          currentLocation,
          normalizedLocation
        )
      } else {
        return this.matchLocation(
          {
            ...redirect,
            query: this.history.utils.normalizeQuery(redirect.query || {}),
            hash: redirect.hash || '',
          },
          currentLocation,
          normalizedLocation
        )
      }
    } else {
      // add the redirectedFrom field
      const url = this.history.utils.normalizeLocation({
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
   * Trigger a navigation, adding an entry to the history stack. Also apply all navigation
   * guards first
   * @param to where to go
   */
  async push(to: RouteLocation): Promise<RouteLocationNormalized> {
    let url: HistoryLocationNormalized
    let location: RouteLocationNormalized
    // TODO: refactor into matchLocation to return location and url
    if (typeof to === 'string' || 'path' in to) {
      url = this.history.utils.normalizeLocation(to)
      // TODO: should allow a non matching url to allow dynamic routing to work
      location = this.matchLocation(url, this.currentRoute)
    } else {
      // named or relative route
      const query = to.query ? this.history.utils.normalizeQuery(to.query) : {}
      const hash = to.hash || ''
      // we need to resolve first
      location = this.matchLocation({ ...to, query, hash }, this.currentRoute)
      // intentionally drop current query and hash
      url = this.history.utils.normalizeLocation({
        query,
        hash,
        ...location,
      })
    }

    // TODO: should we throw an error as the navigation was aborted
    // TODO: needs a proper check because order could be different
    if (
      this.currentRoute !== START_LOCATION_NORMALIZED &&
      this.currentRoute.fullPath === url.fullPath
    )
      return this.currentRoute

    const toLocation: RouteLocationNormalized = location
    // trigger all guards, throw if navigation is rejected
    try {
      await this.navigate(toLocation, this.currentRoute)
    } catch (error) {
      if (error instanceof NavigationGuardRedirect) {
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
    this.updateReactiveRoute()

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

  private updateReactiveRoute() {
    if (!this.app) return
    this.app._route = this.currentRoute
  }
}
