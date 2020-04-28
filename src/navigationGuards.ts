import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocationRaw,
  RouteLocationNormalizedLoaded,
  NavigationGuardNextCallback,
  isRouteLocation,
  Lazy,
  RouteComponent,
} from './types'

import {
  createRouterError,
  ErrorTypes,
  NavigationFailure,
  NavigationRedirectError,
} from './errors'
import { ComponentPublicInstance } from 'vue'
import { inject, getCurrentInstance, warn } from 'vue'
import { matchedRouteKey } from './injectionSymbols'
import { RouteRecordNormalized } from './matcher/types'
import { isESModule } from './utils'

export function onBeforeRouteLeave(leaveGuard: NavigationGuard) {
  const instance = getCurrentInstance()
  if (!instance) {
    __DEV__ &&
      warn('onBeforeRouteLeave must be called at the top of a setup function')
    return
  }

  const activeRecord: RouteRecordNormalized | undefined = inject(
    matchedRouteKey,
    {} as any
  ).value

  if (!activeRecord) {
    __DEV__ &&
      warn('onBeforeRouteLeave must be called at the top of a setup function')
    return
  }

  activeRecord.leaveGuards.push(
    // @ts-ignore do we even want to allow that? Passing the context in a composition api hook doesn't make sense
    leaveGuard.bind(instance.proxy)
  )
}

export function onBeforeRouteUpdate(updateGuard: NavigationGuard) {
  const instance = getCurrentInstance()
  if (!instance) {
    __DEV__ &&
      warn('onBeforeRouteUpdate must be called at the top of a setup function')
    return
  }

  const activeRecord: RouteRecordNormalized | undefined = inject(
    matchedRouteKey,
    {} as any
  ).value

  if (!activeRecord) {
    __DEV__ &&
      warn('onBeforeRouteUpdate must be called at the top of a setup function')
    return
  }

  activeRecord.updateGuards.push(
    // @ts-ignore do we even want to allow that? Passing the context in a composition api hook doesn't make sense
    updateGuard.bind(instance.proxy)
  )
}

export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  instance?: ComponentPublicInstance | undefined | null
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
        const componentPromise = (rawComponent as Lazy<RouteComponent>)().catch(
          () => null
        )
        guards.push(() =>
          componentPromise.then(resolved => {
            if (!resolved)
              return Promise.reject(
                new Error(
                  `Couldn't resolve component "${name}" for the following record with path "${record.path}"`
                )
              )
            const resolvedComponent = isESModule(resolved)
              ? resolved.default
              : resolved
            // replace the function with the resolved component
            record.components[name] = resolvedComponent
            // @ts-ignore: the options types are not propagated to Component
            const guard: NavigationGuard = resolvedComponent[guardType]
            return (
              // @ts-ignore: the guards matched the instance type
              guard &&
              guardToPromiseFn(guard, to, from, record.instances[name])()
            )
          })
        )
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
