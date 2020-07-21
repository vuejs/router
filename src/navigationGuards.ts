import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardNext,
  RouteLocationRaw,
  RouteLocationNormalizedLoaded,
  NavigationGuardNextCallback,
  isRouteLocation,
  Lazy,
  RouteComponent,
  RawRouteComponent,
} from './types'

import {
  createRouterError,
  ErrorTypes,
  NavigationFailure,
  NavigationRedirectError,
} from './errors'
import { ComponentOptions } from 'vue'
import { inject, getCurrentInstance, warn } from 'vue'
import { matchedRouteKey } from './injectionSymbols'
import { RouteRecordNormalized } from './matcher/types'
import { isESModule } from './utils'

/**
 * Add a navigation guard that triggers whenever the current location is
 * left. Similarly to {@link beforeRouteLeave}, it has access to the
 * component instance as `this`.
 *
 * @param leaveGuard - {@link NavigationGuard}
 */
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

/**
 * Add a navigation guard that triggers whenever the current location is
 * updated. Similarly to {@link beforeRouteUpdate}, it has access to the
 * component instance as `this`.
 *
 * @param updateGuard - {@link NavigationGuard}
 */
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
  from: RouteLocationNormalizedLoaded
): () => Promise<void>
export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  record: RouteRecordNormalized,
  name: string
): () => Promise<void>
export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  record?: RouteRecordNormalized,
  name?: string
): () => Promise<void> {
  // keep a reference to the enterCallbackArray to prevent pushing callbacks if a new navigation took place
  const enterCallbackArray =
    record &&
    // name is defined if record is because of the function overload
    (record.enterCallbacks[name!] = record.enterCallbacks[name!] || [])

  return () =>
    new Promise((resolve, reject) => {
      const next: NavigationGuardNext = (
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
          if (
            enterCallbackArray &&
            // since enterCallbackArray is truthy, both record and name also are
            record!.enterCallbacks[name!] === enterCallbackArray &&
            typeof valid === 'function'
          )
            enterCallbackArray.push(valid)
          resolve()
        }
      }

      // wrapping with Promise.resolve allows it to work with both async and sync guards
      Promise.resolve(
        guard.call(
          record && record.instances[name!],
          to,
          from,
          __DEV__ ? canOnlyBeCalledOnce(next, to, from) : next
        )
      ).catch(err => reject(err))
    })
}

function canOnlyBeCalledOnce(
  next: NavigationGuardNext,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): NavigationGuardNext {
  let called = 0
  return function () {
    if (called++ === 1)
      warn(
        `The "next" callback was called more than once in one navigation guard when going from "${from.fullPath}" to "${to.fullPath}". It should be called exactly one time in each navigation guard. This will fail in production.`
      )
    if (called === 1) next.apply(null, arguments as any)
  }
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
      let rawComponent = record.components[name]
      // warn if user wrote import('/component.vue') instead of () => import('./component.vue')
      if (__DEV__ && 'then' in rawComponent) {
        warn(
          `Component "${name}" in record with path "${record.path}" is a Promise instead of a function that returns a Promise. Did you write "import('./MyPage.vue')" instead of "() => import('./MyPage.vue')"? This will break in production if not fixed.`
        )
        let promise = rawComponent
        rawComponent = () => promise
      }

      if (isRouteComponent(rawComponent)) {
        // __vccOpts is added by vue-class-component and contain the regular options
        let options: ComponentOptions =
          (rawComponent as any).__vccOpts || rawComponent
        const guard = options[guardType]
        guard && guards.push(guardToPromiseFn(guard, to, from, record, name))
      } else {
        // start requesting the chunk already
        let componentPromise: Promise<RouteComponent | null> = (rawComponent as Lazy<
          RouteComponent
        >)()

        if (__DEV__ && !('catch' in componentPromise)) {
          warn(
            `Component "${name}" in record with path "${record.path}" is a function that does not return a Promise. If you were passing a functional component, make sure to add a "displayName" to the component. This will break in production if not fixed.`
          )
          componentPromise = Promise.resolve(componentPromise as RouteComponent)
        } else {
          componentPromise = componentPromise.catch(() => null)
        }

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
            return guard && guardToPromiseFn(guard, to, from, record, name)()
          })
        )
      }
    }
  }

  return guards
}

/**
 * Allows differentiating lazy components from functional components and vue-class-component
 * @param component
 */
function isRouteComponent(
  component: RawRouteComponent
): component is RouteComponent {
  return (
    typeof component === 'object' ||
    'displayName' in component ||
    'props' in component ||
    '__vccOpts' in component
  )
}
