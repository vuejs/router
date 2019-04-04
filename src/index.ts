import BaseHistory from './history/base'
import { RouterMatcher } from './matcher'
import {
  RouterLocation,
  RouteRecord,
  START_LOCATION_NORMALIZED,
  RouterLocationNormalized,
} from './types/index'

interface RouterOptions {
  history: BaseHistory
  routes: RouteRecord[]
}

export class Router {
  protected history: BaseHistory
  private matcher: RouterMatcher
  currentRoute: RouterLocationNormalized = START_LOCATION_NORMALIZED

  constructor(options: RouterOptions) {
    this.history = options.history
    this.history.ensureLocation()

    this.matcher = new RouterMatcher(options.routes)
  }

  /**
   * Trigger a navigation, should resolve all guards first
   * @param to Where to go
   */
  push(to: RouterLocation) {
    // TODO: resolve URL
    const location = this.matcher.resolve(to, this.currentRoute)
    // TODO: call hooks, guards
    this.history.push(location.fullPath)
    this.currentRoute = location
  }

  getRouteRecord(location: RouterLocation) {}
}
