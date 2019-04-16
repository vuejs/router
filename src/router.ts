import { BaseHistory } from './history/base'
import { RouterMatcher } from './matcher'
import {
  RouteLocation,
  RouteRecord,
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
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
      const url = this.history.parseURL(to)
      const matchedRoute = this.matcher.resolve(url, this.currentRoute)
      console.log({ url, matchedRoute })
      // TODO: navigate
    })
  }

  /**
   * Trigger a navigation, should resolve all guards first
   * @param to Where to go
   */
  push(to: RouteLocation) {
    // TODO: resolve URL
    const url = typeof to === 'string' ? this.history.parseURL(to) : to
    const location = this.matcher.resolve(url, this.currentRoute)
    console.log(location)
    // TODO: call hooks, guards
    // TODO: navigate
    // this.history.push(location.fullPath)
    // this.currentRoute = location
  }

  getRouteRecord(location: RouteLocation) {}
}
