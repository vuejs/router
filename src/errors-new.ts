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
  NAVIGATION_GUARD_REDIRECT = 'NAVIGATION_GUARD_REDIRECT',
  NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
  NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',
}

interface RouterError extends Error {
  type: ErrorTypes
}

interface MatcherError extends RouterError {
  type: ErrorTypes.MATCHER_NOT_FOUND
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

interface NavigationRedirectError extends Omit<NavigationError, 'to'> {
  type: ErrorTypes.NAVIGATION_GUARD_REDIRECT
  to: RouteLocation
}

type InferErrorType<Type extends ErrorTypes> = Type extends MatcherError['type']
  ? MatcherError
  : Type extends NavigationRedirectError['type']
  ? NavigationRedirectError
  : Type extends NavigationError['type']
  ? NavigationError
  : never

const ErrorTypeMessages = __DEV__
  ? {
      [ErrorTypes.MATCHER_NOT_FOUND]({
        location,
        currentLocation,
      }: MatcherError) {
        return `No match for\n ${JSON.stringify(location)}${
          currentLocation
            ? '\nwhile being at\n' + JSON.stringify(currentLocation)
            : ''
        }`
      },
      [ErrorTypes.NAVIGATION_GUARD_REDIRECT]({
        from,
        to,
      }: NavigationRedirectError) {
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
  : undefined

export function createRouterError<Type extends ErrorTypes>(
  type: Type,
  params: Omit<InferErrorType<Type>, 'type' | keyof Error>
): InferErrorType<Type> {
  const message = __DEV__ ? (ErrorTypeMessages as any)[type](params) : undefined
  const error = Object.assign(new Error(message), { type }, params)
  return (error as unknown) as InferErrorType<Type>
}

const propertiesToLog = ['params', 'query', 'hash'] as const

function stringifyRoute(to: RouteLocation): string {
  if (typeof to === 'string') return to
  if ('path' in to) return to.path
  const location = {} as Record<string, unknown>
  for (const key of propertiesToLog) {
    if (key in to) location[key] = to[key]
  }
  return JSON.stringify(location, null, 2)
}
