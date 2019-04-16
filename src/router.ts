import { BaseHistory } from './history/base'
import { RouterMatcher } from './matcher'
import {
  RouteLocation,
  RouteRecord,
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
  RouteQuery,
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
    let url, fullPath: string, query: RouteQuery, hash: string
    if (typeof to === 'string') {
      url = this.history.parseURL(to)
      fullPath = url.fullPath
      query = url.query
      hash = url.hash
    } else if ('path' in to) {
      fullPath = this.history.stringifyURL(to)
      query = to.query || {}
      hash = to.hash || ''
      url = to
    } else if ('name' in to) {
      // we need to resolve first
      url = to
    } else {
      // we need to resolve first
      url = to
    }
    console.log('going to', to)
    const location = this.matcher.resolve(url, this.currentRoute)

    console.log(location)
    // @ts-ignore
    console.log({ fullPath, query, hash })
    console.log('---')
    // TODO: call hooks, guards
    // TODO: navigate
    // this.history.push(location.fullPath)
    // this.currentRoute = {
    //   ...url,
    //   ...location,
    //   fullPath,
    //   query,
    //   hash,
    // }
  }

  getRouteRecord(location: RouteLocation) {}
}
