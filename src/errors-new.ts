import {
  MatcherLocation,
  MatcherLocationNormalized,
  RouteLocation,
  RouteLocationNormalized,
} from './types'

// Using string enums because error codes are exposed to developers
// and number enums could collide with other error codes in runtime
export enum ErrorTypes {
  NO_ROUTE_MATCH = 'NO_ROUTE_MATCH',
  INVALID_ROUTE_MATCH = 'INVALID_ROUTE_MATCH',
  NAVIGATION_GUARD_REDIRECT = 'NAVIGATION_GUARD_REDIRECT',
  NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
  NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',
}

interface RouterError {
  type: ErrorTypes
  message: string
  from?: RouteLocation
  to?: RouteLocation
}

const ErrorTypeMessages = {
  [ErrorTypes.NO_ROUTE_MATCH](
    location: MatcherLocation,
    currentLocation?: MatcherLocationNormalized
  ) {
    return `No match for\n ${JSON.stringify(location)}${
      currentLocation
        ? '\nwhile being at\n' + JSON.stringify(currentLocation)
        : ''
    }`
  },
  [ErrorTypes.INVALID_ROUTE_MATCH](location: any) {
    return `Cannot redirect using a relative location:\n${stringifyRoute(
      location
    )}\nUse the function redirect and explicitly provide a name`
  },
  [ErrorTypes.NAVIGATION_GUARD_REDIRECT](
    from: RouteLocationNormalized,
    to: RouteLocation
  ) {
    return `Redirected from "${from.fullPath}" to "${stringifyRoute(
      to
    )}" via a navigation guard`
  },
  [ErrorTypes.NAVIGATION_ABORTED](
    from: RouteLocationNormalized,
    to: RouteLocationNormalized
  ) {
    return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard`
  },
  [ErrorTypes.NAVIGATION_CANCELLED](
    from: RouteLocationNormalized,
    to: RouteLocationNormalized
  ) {
    return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new \`push\` or \`replace\``
  },
}

export function createRouterError<Type extends ErrorTypes>(
  type: Type,
  ...messageArgs: Parameters<typeof ErrorTypeMessages[Type]>
): RouterError {
  const message = (ErrorTypeMessages[type] as any)(...messageArgs)
  const error: RouterError = {
    type: type,
    message,
  }
  if (
    type === ErrorTypes.NAVIGATION_ABORTED ||
    type === ErrorTypes.NAVIGATION_CANCELLED ||
    type === ErrorTypes.NAVIGATION_GUARD_REDIRECT
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
