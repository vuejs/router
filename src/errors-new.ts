import {
  MatcherLocation,
  MatcherLocationNormalized,
  RouteLocation,
  RouteLocationNormalized,
} from './types'

// Using string enums because error codes are exposed to developers
// and number enums could collide with other error codes in runtime
export enum ErrorTypes {
  MATCHER_NOT_FOUND = 'MATCHER_NOT_FOUND',
  INVALID_ROUTE_MATCH = 'INVALID_ROUTE_MATCH',
  NAVIGATION_GUARD_REDIRECT = 'NAVIGATION_GUARD_REDIRECT',
  NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
  NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',
}

interface RouterError extends Error {
  type: ErrorTypes
}

interface MatcherError extends RouterError {
  type: ErrorTypes.MATCHER_NOT_FOUND | ErrorTypes.INVALID_ROUTE_MATCH
  location: MatcherLocation
  currentLocation?: MatcherLocationNormalized
}

interface NavigationError extends RouterError {
  type:
    | ErrorTypes.NAVIGATION_GUARD_REDIRECT
    | ErrorTypes.NAVIGATION_ABORTED
    | ErrorTypes.NAVIGATION_CANCELLED
  from: RouteLocationNormalized
  to: RouteLocationNormalized
}

type InferErrorType<Type extends ErrorTypes> = Type extends MatcherError['type']
  ? MatcherError
  : Type extends NavigationError['type']
  ? NavigationError
  : never

const ErrorTypeMessages = {
  [ErrorTypes.MATCHER_NOT_FOUND]({ location, currentLocation }: MatcherError) {
    return `No match for\n ${JSON.stringify(location)}${
      currentLocation
        ? '\nwhile being at\n' + JSON.stringify(currentLocation)
        : ''
    }`
  },
  [ErrorTypes.INVALID_ROUTE_MATCH]({ location }: MatcherError) {
    return `Cannot redirect using a relative location:\n${stringifyRoute(
      location
    )}\nUse the function redirect and explicitly provide a name`
  },
  [ErrorTypes.NAVIGATION_GUARD_REDIRECT]({ from, to }: NavigationError) {
    return `Redirected from "${from.fullPath}" to "${stringifyRoute(
      to
    )}" via a navigation guard`
  },
  [ErrorTypes.NAVIGATION_ABORTED]({ from, to }: NavigationError) {
    return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard`
  },
  [ErrorTypes.NAVIGATION_CANCELLED]({ from, to }: NavigationError) {
    return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new \`push\` or \`replace\``
  },
}

export function createRouterError<Type extends ErrorTypes>(
  type: Type,
  params: Omit<InferErrorType<Type>, 'type' | keyof Error>
): InferErrorType<Type> {
  const message = (ErrorTypeMessages[type] as any)(params)
  const error = Object.assign(new Error(message), { type }, params)
  return (error as unknown) as InferErrorType<Type>
}

const propertiesToLog = ['params', 'query', 'hash']

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
