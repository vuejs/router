import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocationRaw,
  RouteLocationNormalizedLoaded,
  NavigationGuardNextCallback,
  isRouteLocation,
} from './types'

import {
  createRouterError,
  ErrorTypes,
  NavigationFailure,
  NavigationRedirectError,
} from './errors'
import { ComponentPublicInstance } from 'vue'
import { inject, getCurrentInstance, warn } from 'vue'
import { matchedRouteKey } from './utils/injectionSymbols'
import { RouteRecordNormalized } from './matcher/types'
import { isESModule } from './utils'

export function onBeforeRouteLeave(leaveGuard: NavigationGuard) {
  const instance = getCurrentInstance()
  if (!instance) {
    __DEV__ &&
      warn('onRouteLeave must be called at the top of a setup function')
    return
  }

  const activeRecord = inject(matchedRouteKey, {} as any).value

  if (!activeRecord) {
    __DEV__ &&
      warn('onRouteLeave must be called at the top of a setup function')
    return
  }

  activeRecord.leaveGuards.push(
    // @ts-ignore do we even want to allow that? Passing the context in a composition api hook doesn't make sense
    leaveGuard.bind(instance.proxy)
  )
}

export function guardToPromiseFn(
  guard: NavigationGuard<undefined>,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  instance?: undefined
): () => Promise<void>
export function guardToPromiseFn<
  ThisType extends ComponentPublicInstance | undefined
>(
  guard: NavigationGuard<ThisType>,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  instance: ThisType
): () => Promise<void> {
  return () =>
    new Promise((resolve, reject) => {
      const next: NavigationGuardCallback = (
        valid?: boolean | RouteLocationRaw | NavigationGuardNextCallback | Error
      ) => {
        if (valid === false)
          reject(
            createRouterError<NavigationFailure>(
              ErrorTypes.NAVIGATION_ABORTED,
              {
                from,
                to,
              }
            )
          )
        else if (valid instanceof Error) {
          reject(valid)
        } else if (isRouteLocation(valid)) {
          reject(
            createRouterError<NavigationRedirectError>(
              ErrorTypes.NAVIGATION_GUARD_REDIRECT,
              {
                from: to,
                to: valid,
              }
            )
          )
        } else {
          // TODO: call the in component enter callbacks. Maybe somewhere else
          // record && record.enterCallbacks.push(valid)
          resolve()
        }
      }

      // wrapping with Promise.resolve allows it to work with both async and sync guards
      Promise.resolve(guard.call(instance, to, from, next)).catch(err =>
        reject(err)
      )
    })
}

type GuardType = 'beforeRouteEnter' | 'beforeRouteUpdate' | 'beforeRouteLeave'

export function extractComponentsGuards(
  matched: RouteRecordNormalized[],
  guardType: GuardType,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded
) {
  const guards: Array<() => Promise<void>> = []

  for (const record of matched) {
    for (const name in record.components) {
      const rawComponent = record.components[name]
      if (typeof rawComponent === 'function') {
        // start requesting the chunk already
        const componentPromise = rawComponent().catch(() => null)
        guards.push(async () => {
          const resolved = await componentPromise
          if (!resolved) throw new Error('TODO: error while fetching')
          const resolvedComponent = isESModule(resolved)
            ? resolved.default
            : resolved
          // replace the function with the resolved component
          record.components[name] = resolvedComponent
          const guard = resolvedComponent[guardType]
          return (
            // @ts-ignore: the guards matched the instance type
            guard && guardToPromiseFn(guard, to, from, record.instances[name])()
          )
        })
      } else {
        const guard = rawComponent[guardType]
        guard &&
          // @ts-ignore: the guards matched the instance type
          guards.push(guardToPromiseFn(guard, to, from, record.instances[name]))
      }
    }
  }

  return guards
}
