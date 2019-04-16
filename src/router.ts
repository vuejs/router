import { BaseHistory, HistoryLocationNormalized } from './history/base'
import { RouterMatcher } from './matcher'
import {
  RouteLocation,
  RouteRecord,
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
  MatcherLocationNormalized,
} from './types/index'

interface RouterOptions {
  history: BaseHistory
  routes: RouteRecord[]
}

export class Router {
  protected history: BaseHistory
  private matcher: RouterMatcher
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
    })
  }

  /**
   * Trigger a navigation, should resolve all guards first
   * @param to Where to go
   */
  push(to: RouteLocation) {
    let url: HistoryLocationNormalized
    let location: MatcherLocationNormalized
    if (typeof to === 'string' || 'path' in to) {
      url = this.history.utils.normalizeLocation(to)
      location = this.matcher.resolve(url, this.currentRoute)
    } else {
      // named or relative route
      // we need to resolve first
      location = this.matcher.resolve(to, this.currentRoute)
      url = this.history.utils.normalizeLocation(location)
    }

    // TODO: call hooks, guards
    this.history.push(url)
    this.currentRoute = {
      ...url,
      ...location,
    }
  }

  getRouteRecord(location: RouteLocation) {}
}
