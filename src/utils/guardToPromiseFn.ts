import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
} from '../types'

export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): () => Promise<void> {
  return () =>
    new Promise((resolve, reject) => {
      const next: NavigationGuardCallback = (valid?: boolean) => {
        // TODO: better error
        // TODO: handle callback
        if (valid === false) reject(new Error('Aborted'))
        else resolve()
      }

      guard(to, from, next)
    })
}
