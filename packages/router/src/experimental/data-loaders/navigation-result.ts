import type { NavigationGuard } from '../../typed-routes'

/**
 * Possible values to change the result of a navigation within a loader
 * @internal
 */
export type _DataLoaderRedirectResult = Exclude<
  ReturnType<NavigationGuard>,
  // only preserve values that cancel the navigation
  Promise<unknown> | Function | true | void | undefined
>

/**
 * Allows data loaders to change navigation. Called by {@link reroute}.
 *
 * @internal
 */
export class NavigationResult {
  constructor(public readonly value: _DataLoaderRedirectResult) {}
}

/**
 * Changes the navigation from within a data loader. Accepts the same values as a navigation
 * guard return: a route location to redirect to, or `false` to cancel the navigation.
 *
 * @example
 * ```ts
 * export const useUserData = defineBasicLoader(async (to) => {
 *   const user = await fetchUser(to.params.id)
 *   if (!user) {
 *     reroute('/404')
 *   }
 *   return user
 * })
 * ```
 */
export function reroute(to: _DataLoaderRedirectResult): never {
  throw new NavigationResult(to)
}
