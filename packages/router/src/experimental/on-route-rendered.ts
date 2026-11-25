import { inject, onActivated, onDeactivated, onUnmounted } from 'vue'
import type { RouteLocationNormalizedLoaded } from '../typed-routes'
import { routerViewOnRouteRenderedKey } from '../injectionSymbols'
import { useRouter } from '../useApi'
import { noop } from '../utils'

/**
 * Called once a navigation is displayed. See `onRouteRendered()`.
 */
export type OnRouteRenderedCallback = (
  to: RouteLocationNormalizedLoaded,
  from: RouteLocationNormalizedLoaded
) => void

function onRouteRenderedClient(callback: OnRouteRenderedCallback): void {
  let callbacks = inject(routerViewOnRouteRenderedKey, null)

  if (!callbacks) {
    // we are above RouterView in the tree, so we create our own set
    callbacks = new Set()
    // outside of any RouterView: afterEach, before the new route renders
    const router = useRouter()
    onUnmounted(
      router.afterEach((to, from, failure) => {
        // a failed navigation displays nothing, like within a RouterView
        if (!failure) {
          for (const registeredCallback of callbacks!) {
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
 * called in `router.afterEach()`, before the new route renders. It is not
 * called for navigations that finished before it was registered (e.g. the
 * initial navigation when the app is mounted after `router.isReady()`).
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
