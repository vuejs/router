import {
  MatcherLocation,
  MatcherLocationNormalized,
  RouteLocation,
  RouteLocationNormalized,
} from './types'

// Using string enums because error codes are exposed to developers
// and number enums could collide with other error codes in runtime
export enum ErrorCodes {
  NO_ROUTE_MATCH = 'NO_ROUTE_MATCH',
  INVALID_ROUTE_MATCH = 'INVALID_ROUTE_MATCH',
  NAVIGATION_GUARD_REDIRECT = 'NAVIGATION_GUARD_REDIRECT',
  NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
  NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',
}

interface RouterError {
  code: ErrorCodes
  message: string
  from?: RouteLocation
  to?: RouteLocation
}

const ErrorTypeMessages = {
  [ErrorCodes.NO_ROUTE_MATCH](
    location: MatcherLocation,
    currentLocation?: MatcherLocationNormalized
  ) {
    return `No match for\n ${JSON.stringify(location)}${
      currentLocation
        ? '\nwhile being at\n' + JSON.stringify(currentLocation)
        : ''
    }`
  },
  [ErrorCodes.INVALID_ROUTE_MATCH](location: any) {
    return `Cannot redirect using a relative location:\n${stringifyRoute(
      location
    )}\nUse the function redirect and explicitly provide a name`
  },
  [ErrorCodes.NAVIGATION_GUARD_REDIRECT](
    from: RouteLocationNormalized,
    to: RouteLocation
  ) {
    return `Redirected from "${from.fullPath}" to "${stringifyRoute(
      to
    )}" via a navigation guard`
  },
  [ErrorCodes.NAVIGATION_ABORTED](
    from: RouteLocationNormalized,
    to: RouteLocationNormalized
  ) {
    return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard`
  },
  [ErrorCodes.NAVIGATION_CANCELLED](
    from: RouteLocationNormalized,
    to: RouteLocationNormalized
  ) {
    return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new \`push\` or \`replace\``
  },
}

export function createRouterError<Code extends ErrorCodes>(
  code: Code,
  ...messageArgs: Parameters<typeof ErrorTypeMessages[Code]>
): RouterError {
  const message = (ErrorTypeMessages[code] as any)(...messageArgs)
  const error: RouterError = {
    code,
    message,
  }
  if (
    code === ErrorCodes.NAVIGATION_ABORTED ||
    code === ErrorCodes.NAVIGATION_CANCELLED ||
    code === ErrorCodes.NAVIGATION_GUARD_REDIRECT
  ) {
    error.from = messageArgs[0]
    error.to = messageArgs[1]
  }
  return error
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
