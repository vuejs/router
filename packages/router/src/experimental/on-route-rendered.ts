import {
  getCurrentInstance,
  inject,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
} from 'vue'
import type { OnRouteRenderedCallback } from '../injectionSymbols'
import { routerViewOnRouteRenderedKey } from '../injectionSymbols'
import { START_LOCATION_NORMALIZED } from '../location'
import { useRouter } from '../useApi'
import { noop } from '../utils'

function onRouteRenderedClient(callback: OnRouteRenderedCallback): void {
  let callbacks = inject(routerViewOnRouteRenderedKey, null)

  if (!callbacks) {
    // we are above RouterView in the tree, so we create our own set
    callbacks = new Set()
    // outside of any RouterView: afterEach, before the new route renders
    const router = useRouter()
    let reportedNavigation = false
    // created by the initial render after the initial navigation (e.g.
    // `app.mount()` after `router.isReady()`): afterEach already ran. Not for
    // components mounted later (e.g. v-if), they wait for the next navigation,
    // like within a RouterView
    if (
      !getCurrentInstance()!.root.isMounted &&
      router.currentRoute.value !== START_LOCATION_NORMALIZED
    ) {
      onMounted(() => {
        if (!reportedNavigation) {
          for (const registeredCallback of callbacks!) {
            registeredCallback(
              router.currentRoute.value,
              START_LOCATION_NORMALIZED
            )
          }
        }
      })
    }
    onUnmounted(
      router.afterEach((to, from, failure) => {
        // a failed navigation displays nothing, like within a RouterView
        if (!failure) {
          for (const registeredCallback of callbacks!) {
            reportedNavigation = true
            registeredCallback(to, from)
          }
        }
      })
    )
  }

  const add = () => callbacks.add(callback)
  const remove = () => callbacks.delete(callback)
  add()
  // a component cached by KeepAlive must not see navigations it doesn't display
  onActivated(add)
  onDeactivated(remove)
  onUnmounted(remove)
}

/**
 * Calls `callback` after each successful navigation. Within a `<RouterView>`,
 * it is called once the closest ancestor `<RouterView>` displays the new
 * route: after the page mounts or updates, after `<Suspense>` resolves, and
 * after an out-in `<Transition>` enters. Outside of any `<RouterView>`, it is
 * called in `router.afterEach()`, before the new route renders, and once
 * mounted if the app is mounted after the initial navigation.
 *
 * Must be called in `setup()`. The callback is removed when the component
 * unmounts and paused while it is deactivated by `<KeepAlive>`. Does nothing
 * during SSR.
 *
 * Within a `<RouterView>` whose route component is memoized with `v-memo`
 * (e.g. `<component :is="Component" v-memo="[route.path]" />`), it is not
 * called for navigations that keep the memo values (e.g. query or hash
 * changes).
 *
 * @param callback - called with the displayed route and the previously
 * displayed one
 */
// never during SSR: nothing is displayed
export const onRouteRendered: (callback: OnRouteRenderedCallback) => void =
  typeof document === 'undefined' ? noop : onRouteRenderedClient
