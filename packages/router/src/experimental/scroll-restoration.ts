import type {
  ComponentInternalInstance,
  FunctionPlugin,
  InjectionKey,
} from 'vue'
import { getCurrentInstance, inject, onMounted, onUpdated } from 'vue'
import type { RouteLocationNormalized, RouteMap } from '../typed-routes'
import type { Router } from '../router'
import { useRouter } from '../useApi'
import type { EXPERIMENTAL_Router } from './router'

export interface ScrollRestorationPluginOptions {
  router: EXPERIMENTAL_Router | Router
}

const HAS_PENDING_SCROLL_RESTORATION: InjectionKey<
  Map<string, Set<ComponentInternalInstance>>
> = Symbol(/* 'HAS_PENDING_SCROLL_RESTORATION' */)

export const ScrollRestoration: FunctionPlugin<
  [options: ScrollRestorationPluginOptions]
> = (app, { router }) => {
  window.history.scrollRestoration = 'manual'

  const activatedInstances = new Map<string, Set<ComponentInternalInstance>>()
  app.provide(HAS_PENDING_SCROLL_RESTORATION, activatedInstances)

  const removeAfterEach = router.afterEach((to, from) => {
    console.log('🚗 After each', from.fullPath, '->', to.fullPath)
    activatedInstances.clear()
  })

  app.onUnmount(removeAfterEach)
}

export const USE_SCROLL_RESTORATION_DEFAULTS = {
  key: (to: RouteLocationNormalized) => to.path + to.hash,
} satisfies UseScrollRestorationOptions

/**
 * Options for `useScrollRestoration()`.
 *
 * @see {@link useScrollRestoration}
 */
export interface UseScrollRestorationOptions<
  Name extends keyof RouteMap = keyof RouteMap,
> {
  /**
   * A key, derived from the route, that is used to store the scroll position.
   * By default, the key is the route's path + hash, meaning going from
   * `/search?q=shoes` to `/search?q=shirts` will reuse the scroll position,
   * but going from `/search?q=shoes` to `/search?q=shoes#anchor` will not.
   * Nested `useScrollRestoration()` calls with the same key will **take over**
   * ancestor calls and completely **override** their scroll restoration
   * behavior.
   */
  key?: string | ((to: RouteLocationNormalized<Name>) => string)

  /**
   * If true, the user must call the returned `scroll()` to trigger the scroll
   * restoration. Useful when the displayed content is not displayed immediately
   * after the navigation, for example when using an animation or a virtualized
   * list.
   */
  manual?: boolean
}

export function useScrollRestoration<
  Name extends keyof RouteMap = keyof RouteMap,
>(options?: UseScrollRestorationOptions<Name>) {
  const router = useRouter()
  const instance = getCurrentInstance()!
  if (__DEV__ && !instance) {
    throw new Error(
      'TODO: useScrollRestoration() must be called in setup() of a component'
    )
  }
  const scrollActivationMap = inject(HAS_PENDING_SCROLL_RESTORATION)!

  const key = options?.key ?? USE_SCROLL_RESTORATION_DEFAULTS.key

  function triggerScrollRestoration() {
    const keyValue =
      typeof key === 'function' ? key(router.currentRoute.value) : key
    let activatedInstances = scrollActivationMap.get(keyValue)
    if (!activatedInstances) {
      scrollActivationMap.set(keyValue, (activatedInstances = new Set()))
    }
    if (!activatedInstances.has(instance)) {
      console.log(
        '♻️ Restoring scroll position for',
        router.currentRoute.value.fullPath
      )
      activatedInstances.add(instance)
    }
  }

  // ensure that we trigger when the component is reused or not
  onMounted(triggerScrollRestoration)
  onUpdated(triggerScrollRestoration)

  return {
    scroll: triggerScrollRestoration,
  }
}
