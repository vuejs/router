import { RouteLocationNormalized, RouteLocation } from './types'

// we could use symbols, but this is for IE9 only and there is
// not Symbol support anyway
const isRouterError = '__RouterError'

/**
 * Generic Error coming from the Router.
 */
export class RouterError extends Error {
  protected __proto__: any
  // @ts-ignore for IE inheritance support
  private [isRouterError] = true

  /**
   * Creates a Router specific Error
   *
   * @param message Error Message
   */
  constructor(message: string) {
    super(message)

    // restore prototype chain
    const actualProto = new.target.prototype

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto)
    } else {
      this.__proto__ = actualProto
    }
  }

  static is(error: Error): error is RouterError {
    // only IE9 seems to break the inheritance chain
    // and set Error as the name
    if (error.name === 'Error') {
      // @ts-ignore for IE inheritance suport
      return error[isRouterError]
    } else {
      return error instanceof RouterError
    }
  }

  get name() {
    return this.constructor.name
  }
}

const isNoRouteMatchError = '__NoRouteMatchError'
export class NoRouteMatchError extends RouterError {
  // @ts-ignore for IE inheritance support
  private [isNoRouteMatchError] = true

  constructor(currentLocation: any, location: any) {
    // TODO: change the merge to provide information that is useful only
    super('No match for ' + JSON.stringify({ ...currentLocation, ...location }))
  }

  static is(error: Error): error is NoRouteMatchError {
    // only IE9 seems to break the inheritance chain
    // and set Error as the name
    if (error.name === 'Error') {
      // @ts-ignore for IE inheritance suport
      return error[isNoRouteMatchError]
    } else {
      return error instanceof NoRouteMatchError
    }
  }
}

const isInvalidRouteMatch = '__InvalidRouteMatch'
/**
 * Error used when the matcher fails to resolve a location
 */
export class InvalidRouteMatch extends RouterError {
  // @ts-ignore for IE inheritance support
  private [isNoRouteMatchError] = true

  constructor(location: any) {
    // TODO: improve the error to include currentLocation and use it for more cases
    super(
      `Cannot redirect using a relative location:\n${stringifyRoute(
        location
      )}\nUse the function redirect and explicitely provide a name`
    )
  }

  static is(error: Error): error is InvalidRouteMatch {
    // only IE9 seems to break the inheritance chain
    // and set Error as the name
    if (error.name === 'Error') {
      // @ts-ignore for IE inheritance suport
      return error[isInvalidRouteMatch]
    } else {
      return error instanceof InvalidRouteMatch
    }
  }
}

const isNavigationGuardRedirect = '__NavigationGuardRedirect'
/**
 * Error used when rejecting a navigation because of a redirection. Contains
 * information about where we where trying to go and where we are going instead
 */
export class NavigationGuardRedirect extends RouterError {
  // @ts-ignore for IE inheritance support
  private [isNoRouteMatchError] = true

  to: RouteLocation
  from: RouteLocationNormalized
  // TODO: refactor order of argumnets
  // TODO: refactor into parent class NavigationError
  constructor(from: RouteLocationNormalized, to: RouteLocation) {
    super(
      `Redirected from "${from.fullPath}" to "${stringifyRoute(
        to
      )}" via a navigation guard`
    )

    this.from = from
    this.to = to
  }

  static is(error: Error): error is NavigationGuardRedirect {
    // only IE9 seems to break the inheritance chain
    // and set Error as the name
    if (error.name === 'Error') {
      // @ts-ignore for IE inheritance suport
      return error[isNavigationGuardRedirect]
    } else {
      return error instanceof NavigationGuardRedirect
    }
  }
}

const isNavigationAborted = '__NavigationAborted'
/**
 * Navigation aborted by next(false)
 */
export class NavigationAborted extends RouterError {
  // @ts-ignore for IE inheritance support
  private [isNavigationAborted] = true

  to: RouteLocationNormalized
  from: RouteLocationNormalized
  constructor(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    super(
      `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard`
    )

    this.from = from
    this.to = to
  }

  static is(error: Error): error is NavigationAborted {
    // only IE9 seems to break the inheritance chain
    // and set Error as the name
    if (error.name === 'Error') {
      // @ts-ignore for IE inheritance suport
      return error[isNavigationAborted]
    } else {
      return error instanceof NavigationAborted
    }
  }
}

const isNavigationCancelled = '__NavigationCancelled'
/**
 * Navigation canceled by the user by pushing/replacing a new location
 * TODO: is the name good?
 */
// @ts-ignore RouterError is a constructor
export class NavigationCancelled extends RouterError {
  // @ts-ignore for IE inheritance support
  private [isNavigationCancelled] = true

  to: RouteLocationNormalized
  from: RouteLocationNormalized
  constructor(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    super(
      `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new \`push\` or \`replace\``
    )

    this.from = from
    this.to = to
  }

  static is(error: Error): error is NavigationCancelled {
    // only IE9 seems to break the inheritance chain
    // and set Error as the name
    if (error.name === 'Error') {
      // @ts-ignore for IE inheritance suport
      return error[isNavigationCancelled]
    } else {
      return error instanceof NavigationCancelled
    }
  }
}

const propertiesToLog: (keyof RouteLocationNormalized)[] = [
  'params',
  'query',
  'hash',
]

function stringifyRoute(to: RouteLocation): string {
  if (typeof to === 'string') return to
  if ('path' in to) return to.path
  const location: Partial<RouteLocationNormalized> = {}
  for (const key of propertiesToLog) {
    // @ts-ignore
    if (key in to) location[key] = to[key]
  }
  return JSON.stringify(location, null, 2)
}
