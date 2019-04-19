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
  NavigationGuardCallback,
} from './types/index'

export interface RouterOptions {
  history: BaseHistory
  routes: RouteRecord[]
}

export class Router {
  protected history: BaseHistory
  private matcher: RouterMatcher
  private beforeGuards: NavigationGuard[] = []
  currentRoute: Readonly<RouteLocationNormalized> = START_LOCATION_NORMALIZED

  constructor(options: RouterOptions) {
    this.history = options.history
    // this.history.ensureLocation()

    this.matcher = new RouterMatcher(options.routes)

    this.history.listen((to, from, info) => {
      // TODO: check navigation guards
      const matchedRoute = this.matcher.resolve(to, this.currentRoute)
      console.log({ to, matchedRoute })
      // TODO: navigate

      this.currentRoute = {
        ...to,
        ...matchedRoute,
      }
    })
  }

  /**
   * Trigger a navigation, should resolve all guards first
   * @param to Where to go
   */
  async push(to: RouteLocation) {
    let url: HistoryLocationNormalized
    let location: MatcherLocationNormalized
    if (typeof to === 'string' || 'path' in to) {
      url = this.history.utils.normalizeLocation(to)
      location = this.matcher.resolve(url, this.currentRoute)
    } else {
      // named or relative route
      // we need to resolve first
      location = this.matcher.resolve(to, this.currentRoute)
      // intentionally drop current query and hash
      url = this.history.utils.normalizeLocation({
        query: to.query ? this.history.utils.normalizeQuery(to.query) : {},
        hash: to.hash,
        ...location,
      })
    }

    // TODO: refactor in a function, some kind of queue
    const toLocation: RouteLocationNormalized = { ...url, ...location }
    await this.navigate(toLocation, this.currentRoute)
    this.history.push(url)
    this.currentRoute = toLocation
  }

  private async navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<TODO> {
    // TODO: Will probably need to be some kind of queue in the future that allows to remove
    // elements and other stuff
    const guards: Array<() => Promise<any>> = []

    for (const guard of this.beforeGuards) {
      guards.push(
        () =>
          new Promise((resolve, reject) => {
            const next: NavigationGuardCallback = (valid?: boolean) => {
              // TODO: better error
              if (valid === false) reject(new Error('Aborted'))
              else resolve()
            }

            guard(to, from, next)
          })
      )
    }

    console.log('Guarding against', guards.length, 'guards')
    for (const guard of guards) {
      await guard()
    }
  }

  getRouteRecord(location: RouteLocation) {}

  beforeEach(guard: NavigationGuard): ListenerRemover {
    this.beforeGuards.push(guard)
    return () => {
      this.beforeGuards.splice(this.beforeGuards.indexOf(guard), 1)
    }
  }
}
